import * as THREE from 'three';

const stages = [['avatar'], ['bone'], ['arteries'], ['arteries', 'brain']];

// Blend complete opaque 3D views in linear light. Meshes keep their own depth
// buffer, so fading never changes surface sorting or exposes back-facing faces.
// Two reusable targets are enough: only adjacent stages contribute to a frame.
export class LayerBlendRenderer {
  constructor(renderer, scene, camera, models) {
    this.renderer=renderer; this.scene=scene; this.camera=camera; this.models=models;
    this.revision=0;
    this.targets=Array.from({length:2},()=>({
      target:new THREE.WebGLRenderTarget(1,1,{
        type:renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType,
        samples:Math.min(2,renderer.capabilities.maxSamples),
        depthBuffer:true,
      }), stage:-1, revision:-1,
    }));
    this.size=new THREE.Vector2();
    this.material=new THREE.ShaderMaterial({
      uniforms:{from:{value:null},to:{value:null},weight:{value:0}},
      depthTest:false,depthWrite:false,toneMapped:true,
      vertexShader:'varying vec2 blendUv; void main(){blendUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`
        uniform sampler2D from;
        uniform sampler2D to;
        uniform float weight;
        varying vec2 blendUv;
        void main(){
          gl_FragColor=mix(texture2D(from,blendUv),texture2D(to,blendUv),weight);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);
    this.output=new THREE.Scene();this.output.add(this.quad);
    this.outputCamera=new THREE.Camera();
  }
  invalidate(){this.revision++;}
  resize(){
    this.renderer.getDrawingBufferSize(this.size);
    for(const slot of this.targets){
      if(slot.target.width!==this.size.x||slot.target.height!==this.size.y){
        slot.target.setSize(this.size.x,this.size.y);slot.revision=-1;
      }
    }
  }
  render({from,to,weight}) {
    this.resize();
    const needed=from===to?[from]:[from,to];
    const slots=needed.map(stage=>{
      // Preserve the shared stage when moving from e.g. avatar/bone to bone/vessels.
      let slot=this.targets.find(s=>s.stage===stage);
      if(!slot){slot=this.targets.find(s=>!needed.includes(s.stage));slot.stage=stage;slot.revision=-1;}
      return slot;
    });
    try {
      for(let i=0;i<slots.length;i++){
        const slot=slots[i];
        if(slot.revision===this.revision)continue;
        for(const [name,model] of Object.entries(this.models))model.visible=stages[needed[i]].includes(name);
        this.renderer.setRenderTarget(slot.target);
        this.renderer.render(this.scene,this.camera);
        slot.revision=this.revision;
      }
      this.renderer.setRenderTarget(null);
      this.material.uniforms.from.value=slots[0].target.texture;
      this.material.uniforms.to.value=slots.at(-1).target.texture;
      this.material.uniforms.weight.value=weight;
      this.renderer.render(this.output,this.outputCamera);
    } finally {
      this.renderer.setRenderTarget(null);
    }
  }
  dispose(){
    this.targets.forEach(s=>s.target.dispose());
    this.quad.geometry.dispose();this.material.dispose();
  }
}
