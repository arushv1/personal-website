import * as THREE from 'three';

const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
// The landmarks are continuous windows, never switches between finished views.
export function densityWindows(value){
 const r=THREE.MathUtils.clamp(value,0,100);
 return {avatar:r<34,bone:r>16&&r<74,arteries:r>23,brain:r>74,
  glass:smooth(15,23,r)*(1-smooth(27,35,r))};
}

// Sample the same fixed world-space field once per vertex at load time. GPU
// interpolation then provides connected, smooth density without 3D texture
// fetches on every fragment of every transparency pass. Geometry never moves.
const hash=(x,y,z)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,1274126177);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
function noise(x,y,z){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),f=t=>t*t*(3-2*t),tx=f(x-ix),ty=f(y-iy),tz=f(z-iz);
 let sum=0;for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)sum+=hash(ix+dx,iy+dy,iz+dz)*(dx?tx:1-tx)*(dy?ty:1-ty)*(dz?tz:1-tz);return sum;
}
export function sampleDensityField(x,y,z){return .72*noise(x*1.92+.84,y*1.92+1.48,z*1.92+.44)+.28*noise(x*4.28+1.72,y*4.28+.52,z*4.28+2.84);}
export function attachDensityField(geometry,matrix){
 const positions=geometry.attributes.position,values=new Uint16Array(positions.count),p=new THREE.Vector3();
 for(let i=0;i<positions.count;i++){p.fromBufferAttribute(positions,i).applyMatrix4(matrix);values[i]=Math.round(sampleDensityField(p.x,p.y,p.z)*65535);}
 geometry.setAttribute('revealField',new THREE.Uint16BufferAttribute(values,1,true));
}

// Transfer function evaluated per pixel from cached surface attributes. It is
// shared by every layer, with one global reveal value and no temporal noise.
export const densityTransferGLSL=`
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float densityAlpha(int layer,float organic,float structure,float r){
 float d=.10+.84*clamp(.5+2.2*(organic-.5),0.0,1.0);
 if(layer==0){float edge=mix(-.5,1.08,ramp(18.0,34.0,r));return (1.0-.52*ramp(15.0,23.0,r))*smoothstep(edge-.12,edge+.12,d);}
 if(layer==1){d=.12+.63*structure+.30*clamp(.5+2.2*(organic-.5),0.0,1.0);float enter=mix(1.45,-.30,ramp(15.0,27.0,r));float leave=mix(-.30,1.45,ramp(46.0,80.0,r));return smoothstep(enter-.13,enter+.13,d)*ramp(16.0,29.0,r)*smoothstep(leave-.14,leave+.14,d)*(1.0-.75*ramp(57.0,79.0,r));}
 if(layer==2){float enter=mix(1.15,-.3,ramp(23.0,50.0,r));float erosion=.60*ramp(68.0,100.0,r);float vessel=.18+.87*structure+.13*(organic-.5);return smoothstep(enter-.15,enter+.15,d)*smoothstep(erosion-.10,erosion+.10,vessel);}
 float enter=mix(1.15,-.3,ramp(74.0,98.0,r));return smoothstep(enter-.18,enter+.18,d);
}
`;

export class DensityReveal{
 constructor(){
  this.materials=new Set();
  this.uniforms={densityPeel:{value:0},densityPreviousDepth:{value:null},densityResolution:{value:new THREE.Vector2(1,1)},densityMajorOnly:{value:0},densityFar:{value:50},densityColorScale:{value:1},brainSliceZ:{value:0},brainSliceHalf:{value:0},brainSliceHighlight:{value:0},brainSliceExtract:{value:0}};
 }
 install(material,name){
  const previousCompile=name==='slice'?material.onBeforeCompile:null,previousKey=name==='slice'?material.customProgramCacheKey():'';
  material.transparent=false;material.alphaHash=false;material.alphaTest=0;material.depthWrite=true;material.blending=THREE.NoBlending;material.side=THREE.FrontSide;
  material.onBeforeCompile=(shader,renderer)=>{
   previousCompile?.call(material,shader,renderer);
   Object.assign(shader.uniforms,this.uniforms);
   shader.vertexShader='attribute float revealDensity;attribute float revealField;varying float densityFieldValue;varying float densityStructure;varying float densityViewDepth;\n'+shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    densityFieldValue=revealField;densityStructure=revealDensity;densityViewDepth=-mvPosition.z;`);
   shader.fragmentShader=`layout(location=1) out highp vec4 densityFeatures;
    uniform float densityPeel;uniform sampler2D densityPreviousDepth;uniform vec2 densityResolution;uniform float densityMajorOnly;uniform float densityFar;uniform float densityColorScale;
    varying float densityFieldValue;varying float densityStructure;varying float densityViewDepth;
    `+shader.fragmentShader;
   if(name==='brain'){
    shader.vertexShader='varying float brainSliceLocalZ;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbrainSliceLocalZ=position.z;');
    shader.fragmentShader='varying float brainSliceLocalZ;uniform float brainSliceZ;uniform float brainSliceHalf;uniform float brainSliceHighlight;uniform float brainSliceExtract;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
     if(brainSliceExtract>.001&&abs(brainSliceLocalZ-brainSliceZ)<brainSliceHalf*min(1.0,brainSliceExtract*3.0))discard;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`if(brainSliceHighlight>0.0){
     float sliceBand=1.0-smoothstep(brainSliceHalf-.005,brainSliceHalf+.006,abs(brainSliceLocalZ-brainSliceZ));
     float sliceEdge=1.0-smoothstep(.003,.010,abs(abs(brainSliceLocalZ-brainSliceZ)-brainSliceHalf));
     outgoingLight=mix(outgoingLight,vec3(.95,.025,.015),sliceBand*.76*brainSliceHighlight);
     outgoingLight+=vec3(.72,.012,.008)*sliceEdge*.8*brainSliceHighlight;
    }
    #include <opaque_fragment>`);
   }
   shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`#include <alphamap_fragment>
    if(densityMajorOnly>.5&&densityStructure<.62)discard;
    if(densityPeel>.5&&gl_FragCoord.z<=texture2D(densityPreviousDepth,gl_FragCoord.xy/densityResolution).r+.0000001)discard;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
    vec2 packedDepth=fract(min(densityViewDepth/densityFar,.9999)*vec2(1.0,255.0));packedDepth.x-=packedDepth.y/255.0;
    densityFeatures=vec4(packedDepth,densityFieldValue,${name==='avatar'?'pow(1.0-abs(dot(normal,normalize(vViewPosition))),3.0)':'densityStructure'});
    gl_FragColor=vec4(gl_FragColor.rgb*densityColorScale,1.0);`);
  };
  material.customProgramCacheKey=()=>`density-surface-v3-${name}${previousKey?'-'+previousKey:''}`;this.materials.add(material);material.needsUpdate=true;
 }
 dispose(){this.materials.clear();}
}
