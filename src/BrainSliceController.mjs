import * as THREE from 'three';
import {coronalContour, sliceGeometry, contourRing, flightEase, fitBrainDistance} from './brainSlice.mjs';

const clamp = value => THREE.MathUtils.clamp(value, 0, 1);
const activePhases = new Set(['preparing', 'entering', 'focused', 'retracting', 'returning']);

// Trim the existing pial triangles, rather than loading or approximating a
// second brain. Only the illustrative cut face is closed by the convex contour.
function cortexBand(root, z, half) {
  const positions = [], normals = [], normalMatrix = new THREE.Matrix3();
  const clip = (polygon, boundary, keepAbove) => {
    const result = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      const aIn = keepAbove ? a.position.z >= boundary : a.position.z <= boundary;
      const bIn = keepAbove ? b.position.z >= boundary : b.position.z <= boundary;
      if (aIn) result.push(a);
      if (aIn !== bIn) {
        const t = (boundary - a.position.z) / (b.position.z - a.position.z);
        result.push({position:a.position.clone().lerp(b.position, t), normal:a.normal.clone().lerp(b.normal, t).normalize()});
      }
    }
    return result;
  };
  root.updateWorldMatrix(true, true);
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry, position = geometry.attributes.position, normal = geometry.attributes.normal, index = geometry.index;
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    const count = index ? index.count : position.count;
    for (let i = 0; i < count; i += 3) {
      let polygon = [0, 1, 2].map(offset => {
        const vertex = index ? index.getX(i + offset) : i + offset;
        return {
          position:new THREE.Vector3().fromBufferAttribute(position, vertex).applyMatrix4(mesh.matrixWorld),
          normal:normal ? new THREE.Vector3().fromBufferAttribute(normal, vertex).applyNormalMatrix(normalMatrix) : new THREE.Vector3(0, 0, 1),
        };
      });
      if (polygon.every(vertex => vertex.position.z < z - half) || polygon.every(vertex => vertex.position.z > z + half)) continue;
      polygon = clip(clip(polygon, z - half, true), z + half, false);
      for (let j = 1; j + 1 < polygon.length; j++) for (const vertex of [polygon[0], polygon[j], polygon[j + 1]]) {
        positions.push(vertex.position.x, vertex.position.y, vertex.position.z);
        normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

function featureAttributes(geometry) {
  const count = geometry.attributes.position.count;
  geometry.setAttribute('revealDensity', new THREE.Uint8BufferAttribute(new Uint8Array(count).fill(255), 1, true));
  geometry.setAttribute('revealField', new THREE.Uint8BufferAttribute(new Uint8Array(count).fill(128), 1, true));
  return geometry;
}

/** A focus flight inside the atlas' existing scene, renderer and camera. */
export class BrainSliceController {
  constructor({renderer, scene, camera, controls, models, density, densityRenderer, materials, markDirty, textureUrl = '/vascupath/original.jpg'}) {
    Object.assign(this, {renderer, scene, camera, controls, models, density, densityRenderer, materials, textureUrl});
    this.markDirty = markDirty || (() => {});
    this.phase = 'idle'; this.progress = 0; this.entryProgress = 0; this.returnProgress = 0;
    this.initialPosition = new THREE.Vector3(); this.initialTarget = new THREE.Vector3();
    this.slab = null; this.sliceTarget = null; this.sliceOffset = new THREE.Vector3();
    this.focusTarget = new THREE.Vector3(); this.extractTarget = new THREE.Vector3(); this.frameDirection = new THREE.Vector3(0, 0, 1);
    this._geometries = new Set(); this._materials = new Set(); this._textures = new Set();
    this._disposed = false; this._ready = false; this._preparePromise = null; this._generation = 0; this._hasSnapshot = false;
    this._desiredExtract = false; this._transition = null; this._start = null; this._last = null;
    this._autoFrame = true; this._zoomScale = 1; this._aspect = camera.aspect; this._focus = 0;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._onControlStart = () => {if (this.phase === 'focused') this._autoFrame = false;};
    this.controls.addEventListener('start', this._onControlStart);
  }

  get active() { return activePhases.has(this.phase); }
  get extracted() { return this._desiredExtract; }
  get amount() { return this.progress; }
  get vesselOpacity() { return 1 - this._focus; }
  get plane() { return {z:this.z, half:this.half}; }

  prepare() {
    if (this._preparePromise) return this._preparePromise;
    this._preparePromise = this._prepare();
    return this._preparePromise;
  }

  async _prepare() {
    // The alternative comparison renderers retain their existing atlas. Their
    // research inspector can still open without a replacement 3D renderer.
    if (!this.density || !this.densityRenderer?.registerSlice || !this.models.brain) return false;
    const brain = this.models.brain;
    brain.updateWorldMatrix(true, true);
    this.brainBounds = new THREE.Box3().setFromObject(brain);
    const size = this.brainBounds.getSize(new THREE.Vector3());
    this.z = THREE.MathUtils.lerp(this.brainBounds.min.z, this.brainBounds.max.z, .56);
    this.half = Math.max(.03, size.z * .03);
    const uniforms = this.density.uniforms;
    for (const [name, value] of Object.entries({brainSliceZ:this.z, brainSliceHalf:this.half, brainSliceHighlight:0, brainSliceExtract:0})) {
      if (!uniforms[name]) uniforms[name] = {value};
      else uniforms[name].value = value;
    }
    let texture = null;
    try {
      texture = await new THREE.TextureLoader().loadAsync(this.textureUrl);
      if (this._disposed) { texture.dispose(); return false; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this._textures.add(texture);
    } catch (error) {
      if (!this._disposed) console.warn('The illustrative brain slice texture could not load.', error);
    }
    if (this._disposed) return false;
    const contour = coronalContour(brain, this.z);
    const faceGeometry = sliceGeometry(contour, this.z, this.half * 2, texture ? texture.image.width / texture.image.height : 1.5);
    const bandGeometry = cortexBand(brain, this.z, this.half);
    const face = new THREE.MeshBasicMaterial({map:texture, color:texture ? '#ffffff' : '#b38eac', toneMapped:false});
    const edge = new THREE.MeshStandardMaterial({color:'#b37e78', roughness:.74});
    const cortex = new THREE.MeshStandardMaterial({color:this.materials?.brain?.color || '#bc796e', roughness:.72});
    const red = new THREE.MeshBasicMaterial({color:'#ee322c', toneMapped:false});
    for (const material of [face, edge, cortex, red]) {
      this.density.install(material, 'slice');
      this._materials.add(material);
    }
    face.side = THREE.DoubleSide;
    const slab = new THREE.Group(); slab.name = 'vascupath-illustrative-coronal-slice'; slab.visible = false;
    for (const geometry of [faceGeometry, bandGeometry]) {featureAttributes(geometry); this._geometries.add(geometry);}
    slab.add(new THREE.Mesh(bandGeometry, cortex), new THREE.Mesh(faceGeometry, [face, edge]));
    for (const side of [-1, 1]) {
      const geometry = featureAttributes(contourRing(contour, this.z + this.half * side));
      this._geometries.add(geometry); slab.add(new THREE.Mesh(geometry, red));
    }
    this.capBounds = faceGeometry.boundingBox.clone().expandByScalar(.015);
    const pickMaterial = new THREE.MeshBasicMaterial({side:THREE.DoubleSide}); this._materials.add(pickMaterial);
    this.sliceTarget = new THREE.Mesh(faceGeometry, pickMaterial);
    this.sliceTarget.name = 'vascupath-original-slice-hit-target'; this.sliceTarget.updateMatrixWorld(true);
    this.slab = slab; this.scene.add(slab); this.models.slice = slab;
    this.densityRenderer.registerSlice(slab);
    this._chooseOffset(); this._updateFit();
    // No pose, viewport, render target, or existing model visibility changes here.
    // The renderer compiles and primes its own new capture/composition variants.
    await this.densityRenderer.prepareFocus?.();
    if (this._disposed) return false;
    this._ready = true; this.markDirty();
    return true;
  }

  async enter({onFocused} = {}) {
    if (this._disposed) return false;
    if (this.active) return this._ready;
    const generation = ++this._generation;
    this._onFocused = onFocused; this._onReturned = null;
    this._desiredExtract = false; this.progress = 0; this.entryProgress = 0; this.returnProgress = 0;
    this.initialPosition.copy(this.camera.position); this.initialTarget.copy(this.controls.target);
    this._initialQuaternion = this.camera.quaternion.clone(); this._hasSnapshot = true;
    this._savedControls = Object.fromEntries(['enabled', 'enableDamping', 'autoRotate', 'minDistance', 'maxDistance'].map(key => [key, this.controls[key]]));
    this._drain(); this.controls.enabled = false; this.controls.autoRotate = false;
    this.controls.minDistance = Math.min(1.8, this._savedControls.minDistance);
    this.controls.maxDistance = Math.max(20, this._savedControls.maxDistance);
    this.frameDirection.copy(this.initialPosition).sub(this.initialTarget).normalize();
    this._homeDirection = this.frameDirection.clone(); this._zoomScale = 1; this._autoFrame = true;
    this.phase = 'preparing'; this._start = null;
    let available = false;
    try { available = await this.prepare(); }
    catch (error) {if (!this._disposed) console.error('Brain slice preparation failed.', error);}
    if (this._disposed || generation !== this._generation || this.phase !== 'preparing') return false;
    if (!available) {
      this.phase = 'focused'; this._restoreControls(); this._onFocused?.(false); this._onFocused = null;
      return false;
    }
    this._chooseOffset(); this._updateFit(); this._setFocus(0);
    this.phase = 'entering'; this._start = null; this._last = null;
    this.markDirty(); return true;
  }

  extract(value = true) {
    this._desiredExtract = Boolean(value);
    if (!this._ready || this.phase !== 'focused') return;
    this._beginExtraction(this._desiredExtract ? 1 : 0);
  }

  close({onReturned} = {}) {
    if (this._disposed) {onReturned?.(); return;}
    if (this.phase === 'returning' || this.phase === 'retracting') {if (onReturned) this._onReturned = onReturned; return;}
    this._onReturned = onReturned; this._onFocused = null; this._desiredExtract = false;
    if (!this.active || this.phase === 'preparing' || !this._ready) {
      ++this._generation; this._finishReturn(); return;
    }
    this._drain(); this.controls.enabled = false; this.controls.autoRotate = false;
    this._transition = null;
    if (this.progress > .0001) {
      this._captureFrame(); this.phase = 'retracting';
      this._transition = {from:this.progress, to:0, start:null, duration:320};
    } else this._beginReturn();
    this.markDirty();
  }

  _drain() {
    const position = this.camera.position.clone(), target = this.controls.target.clone();
    this.controls.autoRotate = false; this.controls.enableDamping = false; this.controls.update(0);
    this._applyPose(position, target);
  }

  _chooseOffset() {
    const width = this.brainBounds.getSize(new THREE.Vector3()).x;
    this.sliceOffset.set(-this.frameDirection.z, 0, this.frameDirection.x).normalize().multiplyScalar(width * 1.18).addScaledVector(this.frameDirection, .05);
  }

  _updateFit() {
    if (!this.brainBounds || !this.capBounds) return;
    this.brainBounds.getCenter(this.focusTarget);
    const union = this.brainBounds.clone().union(this.capBounds.clone().translate(this.sliceOffset));
    union.getCenter(this.extractTarget);
    this._focusDistance = fitBrainDistance(this.brainBounds, this.focusTarget, this.frameDirection, this.camera.aspect, this.camera.fov);
    this._extractDistance = fitBrainDistance(union, this.extractTarget, this.frameDirection, this.camera.aspect, this.camera.fov);
    this._aspect = this.camera.aspect;
  }

  _framePose(amount) {
    const target = this.focusTarget.clone().lerp(this.extractTarget, amount);
    const position = target.clone().addScaledVector(this.frameDirection, THREE.MathUtils.lerp(this._focusDistance, this._extractDistance, amount) * this._zoomScale);
    return {position, target};
  }

  _captureFrame() {
    this.frameDirection.copy(this.camera.position).sub(this.controls.target).normalize();
    if (this.progress < .001) this._chooseOffset();
    this._updateFit();
    this._zoomScale = this.camera.position.distanceTo(this.controls.target) / THREE.MathUtils.lerp(this._focusDistance, this._extractDistance, this.progress);
    this._autoFrame = true;
  }

  _applyPose(position, target) {
    this.camera.position.copy(position); this.controls.target.copy(target);
    this.camera.lookAt(target); this.camera.updateMatrixWorld(true);
  }

  _setUniform(name, value) {
    const uniform = this.density?.uniforms[name];
    if (!uniform || uniform.value === value) return false;
    uniform.value = value; return true;
  }

  _setFocus(value) {
    this._focus = value;
    if (this.densityRenderer) this.densityRenderer.focus = value;
  }

  _beginExtraction(to) {
    if (Math.abs(to - this.progress) < 1e-6 && !this._transition) return;
    this._drain(); this.controls.enabled = false; this._captureFrame();
    this._transition = {from:this.progress, to, start:null, duration:500}; this.markDirty();
  }

  _beginReturn() {
    this.phase = 'returning'; this._start = null;
    this._returnPosition = this.camera.position.clone(); this._returnTarget = this.controls.target.clone();
    this._returnFocus = this._focus; this._transition = null;
    this._returnHighlight = this.density?.uniforms.brainSliceHighlight?.value || 0;
  }

  _restoreControls() {
    if (!this._savedControls) return;
    Object.assign(this.controls, this._savedControls);
    this._savedControls = null;
  }

  _finishReturn() {
    this.progress = 0; this.returnProgress = 1; this._transition = null;
    this._setFocus(0); this._setUniform('brainSliceHighlight', 0); this._setUniform('brainSliceExtract', 0);
    if (this.slab) {this.slab.visible = false; this.slab.position.set(0, 0, 0); this.slab.updateMatrixWorld(true);}
    if (this._hasSnapshot) {
      this._applyPose(this.initialPosition, this.initialTarget);
      if (this._initialQuaternion) {this.camera.quaternion.copy(this._initialQuaternion); this.camera.updateMatrixWorld(true);}
    }
    this._restoreControls();
    this.phase = 'returned'; this.densityRenderer?.invalidate(); this.markDirty();
    const callback = this._onReturned; this._onReturned = null; callback?.();
  }

  update(time) {
    if (this._disposed || !this.active || this.phase === 'preparing' || !this._ready) return false;
    let changed = false;
    const dt = this._last == null ? 0 : Math.max(0, (time - this._last) / 1000); this._last = time;
    const resized = this._aspect !== this.camera.aspect;
    if (resized) {this._updateFit(); changed = true;}
    if (this.phase === 'entering') {
      if (this._start == null) this._start = time;
      const elapsed = time - this._start, linear = this.reduced ? 1 : clamp(elapsed / 900);
      this.entryProgress = flightEase(linear);
      const goal = this._framePose(0);
      this._applyPose(this.initialPosition.clone().lerp(goal.position, this.entryProgress), this.initialTarget.clone().lerp(goal.target, this.entryProgress));
      this._setFocus(this.reduced ? 1 : flightEase(clamp(elapsed / 280)));
      this._setUniform('brainSliceHighlight', this.entryProgress); changed = true;
      if (linear === 1) {
        this.phase = 'focused'; this.controls.enabled = true; this.controls.enableDamping = true;
        this.controls.update(0);
        const callback = this._onFocused; this._onFocused = null; callback?.(true);
        if (this._desiredExtract) this._beginExtraction(1);
      }
    } else if (this.phase === 'focused') {
      if (this._transition) {
        const transition = this._transition; if (transition.start == null) transition.start = time;
        const linear = this.reduced ? 1 : clamp((time - transition.start) / transition.duration);
        this.progress = THREE.MathUtils.lerp(transition.from, transition.to, flightEase(linear));
        const pose = this._framePose(this.progress); this._applyPose(pose.position, pose.target); changed = true;
        if (linear === 1) {this._transition = null; this.controls.enabled = true; this.controls.enableDamping = true; this.controls.update(0);}
      } else {
        const position = this.camera.position.clone(), quaternion = this.camera.quaternion.clone();
        this.controls.update(dt);
        changed ||= this.camera.position.distanceToSquared(position) > 1e-14 || 1 - Math.abs(this.camera.quaternion.dot(quaternion)) > 1e-14;
        if (resized && this._autoFrame) {const pose = this._framePose(this.progress); this._applyPose(pose.position, pose.target);}
      }
    } else if (this.phase === 'retracting') {
      const transition = this._transition; if (transition.start == null) transition.start = time;
      const linear = this.reduced ? 1 : clamp((time - transition.start) / transition.duration);
      this.progress = THREE.MathUtils.lerp(transition.from, 0, flightEase(linear));
      const pose = this._framePose(this.progress); this._applyPose(pose.position, pose.target); changed = true;
      if (linear === 1) this._beginReturn();
    } else if (this.phase === 'returning') {
      if (this._start == null) this._start = time;
      const elapsed = time - this._start, linear = this.reduced ? 1 : clamp(elapsed / 750);
      this.returnProgress = flightEase(linear);
      this._applyPose(this._returnPosition.clone().lerp(this.initialPosition, this.returnProgress), this._returnTarget.clone().lerp(this.initialTarget, this.returnProgress));
      const tree = this.reduced ? 1 : flightEase(clamp((elapsed - 470) / 280));
      this._setFocus(this._returnFocus * (1 - tree));
      this._setUniform('brainSliceHighlight', this._returnHighlight * (1 - this.returnProgress)); changed = true;
      if (linear === 1) {this._finishReturn(); return true;}
    }
    changed = this._setUniform('brainSliceExtract', this.progress) || changed;
    if (this.slab) {
      this.slab.visible = this.progress > .0001;
      this.slab.position.copy(this.sliceOffset).multiplyScalar(this.progress); this.slab.updateMatrixWorld(true);
    }
    if (changed) {this.densityRenderer?.invalidate(); this.markDirty();}
    return changed;
  }

  zoom(direction) {
    if (this.phase !== 'focused' || this._transition || !this._ready) return;
    this._drain(); this._autoFrame = false;
    const offset = this.camera.position.clone().sub(this.controls.target).multiplyScalar(direction > 0 ? .9 : 1.1).clampLength(this.controls.minDistance, this.controls.maxDistance);
    this._applyPose(this.controls.target.clone().add(offset), this.controls.target);
    this.controls.enableDamping = true; this.markDirty();
  }

  rotate(dx = 0, dy = 0) {
    if (this.phase !== 'focused' || this._transition || !this._ready) return;
    this._drain(); this._autoFrame = false;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta += dx;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    this._applyPose(this.controls.target.clone().add(new THREE.Vector3().setFromSpherical(spherical)), this.controls.target);
    this.controls.enableDamping = true; this.markDirty();
  }

  reset() {
    if (this.phase !== 'focused' || !this._ready) return;
    this._desiredExtract = false; this.progress = 0; this._transition = null;
    this._drain(); this.frameDirection.copy(this._homeDirection); this._zoomScale = 1; this._autoFrame = true;
    this._chooseOffset();
    this._updateFit(); const pose = this._framePose(this.progress); this._applyPose(pose.position, pose.target);
    this._setUniform('brainSliceExtract', 0);
    if (this.slab) {this.slab.visible = false; this.slab.position.set(0, 0, 0); this.slab.updateMatrixWorld(true);}
    this.controls.enabled = true; this.controls.enableDamping = true;
    this.densityRenderer?.invalidate(); this.markDirty();
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true; ++this._generation;
    this.controls.removeEventListener('start', this._onControlStart);
    this._setFocus(0); this._setUniform('brainSliceHighlight', 0); this._setUniform('brainSliceExtract', 0);
    if (this._hasSnapshot) {
      this._applyPose(this.initialPosition, this.initialTarget);
      if (this._initialQuaternion) {this.camera.quaternion.copy(this._initialQuaternion); this.camera.updateMatrixWorld(true);}
    }
    this._restoreControls(); this.densityRenderer?.unregisterSlice?.();
    this.slab?.removeFromParent(); if (this.models.slice === this.slab) delete this.models.slice;
    for (const geometry of this._geometries) geometry.dispose();
    for (const material of this._materials) {this.density?.materials?.delete(material); material.dispose();}
    for (const texture of this._textures) texture.dispose();
    this._geometries.clear(); this._materials.clear(); this._textures.clear();
    this._onFocused = null; this._onReturned = null; this.phase = 'disposed';
    this.densityRenderer?.invalidate(); this.markDirty();
  }
}

export const createBrainSliceController = options => new BrainSliceController(options);
