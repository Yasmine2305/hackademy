/* HACKADEMY — moteur 3D (Three.js r128 + bloom), en module ES pour React.
   Toutes les scènes parlent du même objet : le paquet 0x7F3A et ses 12 octets. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

var C={bg:0x060B14,green:0x3DFFA0,cyan:0x38BDF8,amber:0xFFC23D,red:0xFF4D5E,white:0xE8F1F5,slate:0x1B2A3C,steel:0x2F4358};
var HEX={green:'#3DFFA0',cyan:'#38BDF8',amber:'#FFC23D',red:'#FF4D5E',white:'#E8F1F5',muted:'#93A4B3'};
var GLYPH={T:'11111 00100 00100 00100 00100 00100 00100',H:'10001 10001 10001 11111 10001 10001 10001',E:'11111 10000 10000 11110 10000 10000 11111',M:'10001 11011 10101 10101 10001 10001 10001',I:'11111 00100 00100 00100 00100 00100 11111',S:'01111 10000 10000 01110 00001 00001 11110',N:'10001 11001 10101 10101 10011 10001 10001',G:'01110 10001 10000 10111 10001 10001 01110',P:'11110 10001 10001 11110 10000 10000 10000',A:'01110 10001 10001 11111 10001 10001 10001',C:'01110 10001 10000 10000 10000 10001 01110',K:'10001 10010 10100 11000 10100 10010 10001',D:'11110 10001 10001 10001 10001 10001 11110',Y:'10001 10001 01010 00100 00100 00100 00100',' ':'00000 00000 00000 00000 00000 00000 00000'};
var STATIC=false,stages=[],raf=null,clock=null;
function ok(){try{var c=document.createElement('canvas');return !!((c.getContext('webgl')||c.getContext('experimental-webgl')));}catch(e){return false;}}
function reduced(){return matchMedia('(prefers-reduced-motion:reduce)').matches;}

/* ---------- Scène générique ---------- */
function Stage(el,o){
 o=o||{};var w=el.clientWidth||600,h=el.clientHeight||300;
 this.el=el;this.o=o;this.t=0;this.updaters=[];this.visible=true;
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:!!o.alpha,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 var dpr=o.dpr||Math.min(window.devicePixelRatio||1,o.maxDpr||2);this.dpr=dpr;
 this.renderer.setPixelRatio(dpr);this.renderer.setSize(w,h);
 this.renderer.setClearColor(C.bg,o.alpha?0:1);
 this.renderer.toneMapping=THREE.NoToneMapping;
 this.scene=new THREE.Scene();if(o.fog)this.scene.fog=new THREE.FogExp2(C.bg,o.fog);
 this.camera=new THREE.PerspectiveCamera(o.fov||35,w/h,.1,1000);
 this.root=new THREE.Group();this.scene.add(this.root);
 this.rx=o.rx||0;this.ry=o.ry||0;this.dx=0;this.dy=0;this.tx=0;this.ty=0;
 el.appendChild(this.renderer.domElement);this.canvas=this.renderer.domElement;this.canvas.setAttribute('aria-hidden','true');
 var hemi=new THREE.HemisphereLight(0xBFE6FF,0x0A1420,.42);this.scene.add(hemi);
 var d=new THREE.DirectionalLight(0xffffff,.62);d.position.set(-20,40,50);this.scene.add(d);
 if(o.bloom!==false&&!o.alpha){
  this.composer=new EffectComposer(this.renderer);this.composer.setPixelRatio(dpr);this.composer.setSize(w,h);
  this.composer.addPass(new RenderPass(this.scene,this.camera));
  this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(w,h),o.bloomS||.34,o.bloomR||.6,o.bloomT||.72));
 }
 var self=this;
 if(o.drag!==false&&!o.alpha){
  var dn=false,px=0,py=0;this.canvas.style.touchAction='pan-y';this.canvas.style.cursor='grab';
  this.canvas.addEventListener('pointerdown',function(e){dn=true;px=e.clientX;py=e.clientY;self.canvas.style.cursor='grabbing';});
  this.listen('pointerup',function(){dn=false;self.canvas.style.cursor='grab';});
  this.listen('pointermove',function(e){if(dn){self.dy+=(e.clientX-px)*.006;self.dx+=(e.clientY-py)*.004;self.dx=Math.max(-.6,Math.min(.6,self.dx));px=e.clientX;py=e.clientY;}});
 }
 if(o.parallax)this.listen('pointermove',function(e){self.tx=(e.clientY/innerHeight-.5)*.1;self.ty=(e.clientX/innerWidth-.5)*.16;});
 if(window.ResizeObserver){this.ro=new ResizeObserver(function(){self.resize();});this.ro.observe(el);}
 if(window.IntersectionObserver){this.io=new IntersectionObserver(function(en){self.visible=en[0].isIntersecting;});this.io.observe(el);}
 stages.push(this);
}
Stage.prototype.resize=function(){var w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;if(this.w===w&&this.h===h)return;this.w=w;this.h=h;this.renderer.setSize(w,h);if(this.composer)this.composer.setSize(w,h);this.camera.aspect=w/h;if(this.onResize)this.onResize(w/h);this.camera.updateProjectionMatrix();if(STATIC)this.draw();};
Stage.prototype.on=function(f){this.updaters.push(f);};
Stage.prototype.draw=function(dt){
 this.t+=dt||0;var t=this.t,i;
 for(i=0;i<this.updaters.length;i++)this.updaters[i](t,dt||0);
 this.px=(this.px||0)+(this.tx-(this.px||0))*.05;this.py=(this.py||0)+(this.ty-(this.py||0))*.05;
 var spin=(this.o.spin&&!STATIC)?t*this.o.spin:0;
 this.root.rotation.x=this.rx+this.dx+this.px;this.root.rotation.y=this.ry+this.dy+this.py+spin;
 if(this.composer)this.composer.render();else this.renderer.render(this.scene,this.camera);
};
Stage.prototype.attach=function(el){this.el=el;el.appendChild(this.canvas);if(this.ro){this.ro.disconnect();this.ro.observe(el);}if(this.io){this.io.disconnect();this.io.observe(el);}this.resize();if(STATIC)this.draw();};
/* écouteurs globaux mémorisés pour pouvoir les retirer au démontage du composant React */
Stage.prototype.listen=function(type,fn){(this.offs||(this.offs=[])).push([type,fn]);window.addEventListener(type,fn);};
Stage.prototype.dispose=function(){
 if(this.ro)this.ro.disconnect();if(this.io)this.io.disconnect();
 (this.offs||[]).forEach(function(l){window.removeEventListener(l[0],l[1]);});
 this.scene.traverse(function(n){if(n.geometry)n.geometry.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(function(m){if(m.map)m.map.dispose();m.dispose();});}});
 this.renderer.dispose();if(this.renderer.forceContextLoss)this.renderer.forceContextLoss();
 if(this.canvas.parentNode)this.canvas.parentNode.removeChild(this.canvas);
 var i=stages.indexOf(this);if(i>=0)stages.splice(i,1);
 if(!stages.length&&raf){cancelAnimationFrame(raf);raf=null;}
};
function tick(){raf=requestAnimationFrame(tick);var dt=Math.min(clock.getDelta(),.05);stages.forEach(function(s){if(s.visible)s.draw(dt);});}
function start(){if(STATIC||raf||reduced())return;clock=new THREE.Clock();tick();}

/* ---------- Petits outils ---------- */
function tex(txt,o){o=o||{};var S=o.size||256,c=document.createElement('canvas');c.width=o.w||S;c.height=o.h||S;var g=c.getContext('2d');
 if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,c.width,c.height);}
 g.fillStyle=o.color||'#fff';g.font=(o.weight||700)+' '+(o.fs||Math.round(S*.46))+'px "JetBrains Mono",monospace';g.textAlign=o.align||'center';g.textBaseline='middle';
 g.fillText(txt,o.align==='left'?12:c.width/2,c.height/2);
 var t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;}
function label(txt,color,scale,o){o=o||{};var fs=48,m=document.createElement('canvas').getContext('2d');m.font='600 '+fs+'px "JetBrains Mono",monospace';var w=Math.ceil(m.measureText(txt).width)+36,h=76;
 var t=tex(txt,{w:w,h:h,fs:fs,weight:600,color:color||HEX.white,bg:o.bg});var mat=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false});var sp=new THREE.Sprite(mat);var s=scale||1;sp.scale.set(w/h*s,s,1);return sp;}
function solid(col,em,op){return new THREE.MeshStandardMaterial({color:col,emissive:em===undefined?col:em,emissiveIntensity:op||.22,metalness:.25,roughness:.5});}
function wireBox(sx,sy,sz,col,opacity){var e=new THREE.EdgesGeometry(new THREE.BoxGeometry(sx,sy,sz));return new THREE.LineSegments(e,new THREE.LineBasicMaterial({color:col,transparent:opacity!==undefined,opacity:opacity===undefined?1:opacity}));}
function floorGrid(size,div,col,op,y){var g=new THREE.GridHelper(size,div,col,col);g.material.transparent=true;g.material.opacity=op;g.position.y=y;return g;}
function rng(seed){var s=seed||1;return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function stars(n,r,col,size,seed){var g=new THREE.BufferGeometry(),p=new Float32Array(n*3),R=rng(seed||7);for(var i=0;i<n;i++){p[i*3]=(R()-.5)*r;p[i*3+1]=(R()-.5)*r*.6;p[i*3+2]=(R()-.5)*r;}g.setAttribute('position',new THREE.BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:col,size:size,transparent:true,opacity:.75,sizeAttenuation:true,depthWrite:false}));}

/* Texte en voxels : renvoie un groupe centré sur l'origine en X */
function voxelLine(txt,p,col,hollow,depth,y,emissive){
 var cells=[],hollowCells=[];
 txt.split('').forEach(function(ch,ci){GLYPH[ch].split(' ').forEach(function(r,ry){r.split('').forEach(function(b,rx){if(b!=='1')return;var x=(ci*6+rx)*p,yy=(6-ry)*p;(ci===hollow?hollowCells:cells).push([x,yy]);});});});
 var w=(txt.length*6-1)*p,g=new THREE.Group(),box=new THREE.BoxGeometry(p*.9,p*.9,depth);
 var m=new THREE.InstancedMesh(box,solid(col,col,emissive===undefined?.2:emissive),cells.length),o=new THREE.Object3D();
 cells.forEach(function(c,i){o.position.set(c[0]-w/2+p/2,c[1]+y,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);});g.add(m);
 if(hollowCells.length){var pts=[];var eg=new THREE.EdgesGeometry(new THREE.BoxGeometry(p*.86,p*.86,depth)),ea=eg.attributes.position.array;
  hollowCells.forEach(function(c){for(var i=0;i<ea.length;i+=3)pts.push(ea[i]+c[0]-w/2+p/2,ea[i+1]+c[1]+y,ea[i+2]);});
  var lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  var lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:C.amber}));g.add(lines);g.userData.hollow=lines;
  var fm=new THREE.InstancedMesh(box,new THREE.MeshBasicMaterial({color:C.amber,transparent:true,opacity:.07,depthWrite:false}),hollowCells.length);
  hollowCells.forEach(function(c,i){o.position.set(c[0]-w/2+p/2,c[1]+y,0);o.updateMatrix();fm.setMatrixAt(i,o.matrix);});g.add(fm);}
 g.userData.mesh=m;g.userData.w=w;return g;
}

/* ---------- Scènes ---------- */
var S={};

S.hero=function(el,o){
 var st=new Stage(el,{fov:32,fog:.0065,parallax:true,drag:false,bloomS:.36,bloomR:.7,bloomT:.62,ry:-.06,rx:.03});
 var portrait=(el.clientWidth/el.clientHeight)<1;if(portrait)st.scene.fog.density=.0025;
 var title=new THREE.Group();
 if(portrait){var pm=1;title.add(voxelLine('THE',pm,C.white,-1,2.2,32));title.add(voxelLine('MISSING',pm,C.white,-1,2.2,23.5));title.add(voxelLine('PACKET',pm*1.14,C.green,1,3,13));}
 else{title.add(voxelLine('THE MISSING',1,C.white,-1,2.2,15.2));title.add(voxelLine('PACKET',1.86,C.green,1,3.6,0));}
 st.root.add(title);
 var hollowGroup=null;title.children.forEach(function(c){if(c.userData.hollow)hollowGroup=c.userData.hollow;});
 // reflet du titre sur le sol
 var refl=title.clone();refl.scale.y=-1;refl.position.y=portrait?-.2:-8;refl.traverse(function(c){if(c.material){c.material=c.material.clone();c.material.transparent=true;c.material.opacity=.09;c.material.depthWrite=false;}});st.root.add(refl);
 // sol
 var FY=portrait?4:-2.5;
 var gr=floorGrid(320,64,C.cyan,.3,FY);st.root.add(gr);
 var gr2=floorGrid(320,16,C.cyan,.42,FY+.01);st.root.add(gr2);
 st.on(function(t){gr.position.z=(t*2.4)%5;gr2.position.z=(t*2.4)%20;});
 // train de paquets au premier plan, avec le trou 0x7F3A
 var N=46,sp=3.1,trainZ=portrait?10:8,trainY=FY+.85,boxG=new THREE.BoxGeometry(1.25,1.25,1.25),GAP=21;
 var tm=new THREE.InstancedMesh(boxG,solid(C.cyan,C.cyan,.38),N),dm=new THREE.Object3D();st.root.add(tm);
 var ghost=wireBox(1.9,1.9,1.9,C.amber);st.root.add(ghost);
 var tag=label('id=0x7f3a  ?',HEX.amber,1.5);st.root.add(tag);
 var red=new THREE.InstancedMesh(boxG,solid(C.red,C.red,.42),3);st.root.add(red);
 var bgl=stars(900,380,C.cyan,.34,11);bgl.position.y=30;st.scene.add(bgl);
 var bgl2=stars(240,300,C.green,.42,23);bgl2.position.y=32;st.scene.add(bgl2);
 st.on(function(t){
  var off=(t*2.8)%sp,span=N*sp;
  for(var i=0;i<N;i++){var x=(i-N/2)*sp+off;if(i===GAP){dm.position.set(9999,0,0);}else dm.position.set(x,trainY,trainZ);dm.rotation.set(0,0,0);dm.updateMatrix();tm.setMatrixAt(i,dm.matrix);}
  tm.instanceMatrix.needsUpdate=true;
  // positionnement stable pour la capture : le trou passe sous le A
  var gx=((GAP-N/2)*sp+off);ghost.position.set(gx,trainY,trainZ);ghost.rotation.set(t*.7,t*.9,0);tag.position.set(gx,trainY+2.3,trainZ);
  for(i=0;i<3;i++){dm.position.set(gx+(i+1)*sp,trainY,trainZ);dm.updateMatrix();red.setMatrixAt(i,dm.matrix);}red.instanceMatrix.needsUpdate=true;
  if(hollowGroup){hollowGroup.material.opacity=1;hollowGroup.visible=(Math.sin(t*9)>-.96);}
  bgl.rotation.y=t*.006;bgl2.rotation.y=-t*.004;
 });
 // lumière colorée
 var l1=new THREE.PointLight(C.cyan,.7,180);l1.position.set(-50,18,40);st.scene.add(l1);
 var l2=new THREE.PointLight(C.green,.6,180);l2.position.set(45,4,38);st.scene.add(l2);
 function fit(a){var cy=portrait?24:12,base=portrait?1.25:1;var d=Math.max(portrait?84:92,(portrait?56:72)/(2*Math.tan(16*Math.PI/180)*a));st.camera.position.set(0,cy-(portrait?-4:-9),d*base);st.camera.lookAt(0,portrait?22:9,0);}
 fit(st.camera.aspect);st.onResize=fit;st.draw(o.t0||6.3);return st;
};

S.ambient=function(el,o){
 var st=new Stage(el,{fov:50,alpha:true,bloom:false,drag:false,maxDpr:1});
 st.camera.position.set(0,0,120);
 var a=stars(1400,560,C.cyan,.62,5);a.material.opacity=.5;st.root.add(a);
 var b=stars(260,560,C.green,.8,9);b.material.opacity=.5;st.root.add(b);
 st.on(function(t){a.rotation.y=t*.008;b.rotation.y=-t*.006;a.rotation.x=t*.002;});
 st.draw(0);return st;
};

/* Le paquet en 3D : même forme que le vidage hexadécimal (4 lignes de 16) */
S.lattice=function(el,o){
 var st=new Stage(el,{fov:30,ry:-.34,rx:.3,bloomS:.3,bloomT:.8});
 st.camera.position.set(0,0,40);
 /* o.header : 40 octets publics ; o.found : 12 × (null | {hex,ch}) envoyés par le serveur */
 var PAY=(o.header||[]).length,P=(o.header||[]).concat(new Array(12).fill('??')),cubes=[],gs=new THREE.BoxGeometry(1.74,1.74,1.74);
 var group=new THREE.Group();st.root.add(group);
 var dim=new THREE.MeshStandardMaterial({color:0x2A3D52,metalness:.3,roughness:.55,emissive:0x101B29,emissiveIntensity:.8});
 var cache={};
 function faceTex(s,col,bg){var k=s+col+bg;if(!cache[k])cache[k]=tex(s,{size:128,fs:60,color:col,bg:bg,weight:700});return cache[k];}
 P.forEach(function(b,i){
  var cx=i%16,cy=Math.floor(i/16),x=(cx-7.5)*2.1+(cx>=8?.45:0),y=(1.5-cy)*2.1,isP=i>=PAY,k=i-PAY;
  var holder=new THREE.Group();holder.position.set(x,y,0);group.add(holder);
  var rec={g:holder,i:i,k:k,isP:isP,x:x,y:y,z:0,cur:isP?7:0};
  if(!isP){var mats=[dim,dim,dim,dim,new THREE.MeshStandardMaterial({map:faceTex(b,'#C4D5E3','#1A2A3C'),metalness:.1,roughness:.7,emissive:0x1A2A3C,emissiveIntensity:.6}),dim];holder.add(new THREE.Mesh(gs,mats));}
  else{
   var side=new THREE.MeshStandardMaterial({color:0x1FB872,emissive:C.green,emissiveIntensity:.22,metalness:.2,roughness:.5});
   var front=new THREE.MeshStandardMaterial({map:faceTex('?','#03130B','#3DFFA0'),roughness:.7});rec.front=front;rec.ch='?';
   rec.solid=new THREE.Mesh(gs,[side,side,side,side,front,side]);holder.add(rec.solid);
   rec.wire=wireBox(1.9,1.9,1.9,C.amber);holder.add(rec.wire);
   rec.mark=new THREE.Sprite(new THREE.SpriteMaterial({map:faceTex('?','#FFC23D','rgba(0,0,0,0)'),transparent:true,depthWrite:false}));rec.mark.scale.set(1.2,1.2,1);holder.add(rec.mark);
  }
  cubes.push(rec);
 });
 var base=floorGrid(46,23,C.cyan,.22,-5.4);st.root.add(base);
 function apply(f,inst){cubes.forEach(function(c){if(!c.isP)return;var on=!!f[c.k];if(on&&f[c.k].ch&&f[c.k].ch!==c.ch){c.ch=f[c.k].ch;c.front.map=faceTex(c.ch,'#03130B','#3DFFA0');c.front.needsUpdate=true;}c.on=on;c.solid.visible=on;c.wire.visible=!on;c.mark.visible=!on;if(inst)c.cur=on?0:2.5;});}
 apply(o.found||[],true);
 st.on(function(t){cubes.forEach(function(c){if(!c.isP)return;var tgt=c.on?0:2.5+Math.sin(t*1.3+c.k)*.3;c.cur+=(tgt-c.cur)*.12;if(STATIC)c.cur=tgt;c.g.position.z=c.cur;if(!c.on){c.wire.rotation.y=t*.8+c.k;c.wire.rotation.x=t*.5+c.k;}});group.rotation.z=Math.sin(t*.3)*.012;});
 st.update=function(u){apply(u.found||[]);if(STATIC)st.draw(0);};
 function fit(a){st.camera.position.z=Math.max(30,40/(2*Math.tan(15*Math.PI/180)*a));}fit(st.camera.aspect);st.onResize=fit;st.draw(2);return st;
};

S.globe=function(el,o){
 var st=new Stage(el,{fov:30,ry:o.ry===undefined?-2.05:o.ry,rx:.36,bloomS:.4,bloomT:.62,spin:.05});
 st.camera.position.set(0,0,o.z||50);st.root.position.x=o.cx||0;
 var R=10,core=new THREE.Mesh(new THREE.SphereGeometry(R*.985,48,48),new THREE.MeshStandardMaterial({color:0x07101C,roughness:.9,metalness:.1}));st.root.add(core);
 var wf=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R,9)),new THREE.LineBasicMaterial({color:C.cyan,transparent:true,opacity:.22}));st.root.add(wf);
 var halo=new THREE.Mesh(new THREE.RingGeometry(R*1.3,R*1.304,160),new THREE.MeshBasicMaterial({color:C.cyan,transparent:true,opacity:.35,side:THREE.DoubleSide}));halo.rotation.x=Math.PI/2.3;st.root.add(halo);
 function pos(lat,lon,r){var a=(90-lat)*Math.PI/180,b=(lon+180)*Math.PI/180,rr=r||R;return new THREE.Vector3(-rr*Math.sin(a)*Math.cos(b),rr*Math.cos(a),rr*Math.sin(a)*Math.sin(b));}
 function node(lat,lon,col,txt){var p=pos(lat,lon,R*1.01),m=new THREE.Mesh(new THREE.BoxGeometry(.42,.42,.42),solid(col,col,.28));m.position.copy(p);m.lookAt(0,0,0);st.root.add(m);if(txt&&!o.mini){var l=label(txt,'#'+('000000'+col.toString(16)).slice(-6),.72);l.position.copy(pos(lat,lon,R*1.2));st.root.add(l);}return p;}
 var def=node(36.8,10.2,C.green,'srv-03'),att=node(52,-100,C.red,'203.0.113.66'),dst=node(-12,62,C.amber,'198.51.100.23');
 function arc(a,b,col,dash){var mid=a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(R*1.55),cv=new THREE.QuadraticBezierCurve3(a,mid,b),g=new THREE.BufferGeometry().setFromPoints(cv.getPoints(80));
  var mat=dash?new THREE.LineDashedMaterial({color:col,dashSize:.5,gapSize:.35}):new THREE.LineBasicMaterial({color:col});var l=new THREE.Line(g,mat);if(dash)l.computeLineDistances();st.root.add(l);
  var pk=new THREE.Mesh(new THREE.BoxGeometry(.32,.32,.32),solid(col,col,.3));st.root.add(pk);st.on(function(t){var u=(t*.28)%1;pk.position.copy(cv.getPoint(u));pk.rotation.set(t,t,0);});}
 arc(att,def,C.red);arc(def,dst,C.amber,true);
 var dust=stars(320,110,C.cyan,.16,3);st.scene.add(dust);
 st.draw(o.t0||1.6);return st;
};

S.network=function(el,o){
 var st=new Stage(el,{fov:26,ry:.62,rx:.5,bloomS:.3,bloomT:.72});
 function fitN(a){st.camera.position.set(0,1.5,Math.max(52,37/(2*Math.tan(13*Math.PI/180)*a)));}fitN(st.camera.aspect);st.onResize=fitN;
 st.root.add(floorGrid(44,22,C.cyan,.2,0));
 var nodes={att:[-14,-4,C.red,'203.0.113.66',2.2],fw:[-5,3,C.cyan,'fw-01',3.2],srv:[6,-1,C.green,'srv-03',5],dst:[14,9,C.amber,'198.51.100.23',2.2]};
 Object.keys(nodes).forEach(function(k){var n=nodes[k],H=n[4];
  var b=new THREE.Mesh(new THREE.BoxGeometry(2.4,H,2.4),new THREE.MeshStandardMaterial({color:0x0C1622,emissive:n[2],emissiveIntensity:.14,metalness:.4,roughness:.5}));b.position.set(n[0],H/2,n[1]);st.root.add(b);
  var w=wireBox(2.42,H,2.42,n[2]);w.position.copy(b.position);st.root.add(w);
  for(var i=1;i<=Math.floor(H/1.1);i++){var s=new THREE.Mesh(new THREE.BoxGeometry(2.44,.09,2.44),new THREE.MeshBasicMaterial({color:n[2],transparent:true,opacity:.6}));s.position.set(n[0],i*1.05-.2,n[1]);st.root.add(s);}
  var l=label(n[3],'#'+('000000'+n[2].toString(16)).slice(-6),1.5);l.position.set(n[0],H+1.5,n[1]);st.root.add(l);});
 function link(a,b,col,broken){var A=new THREE.Vector3(nodes[a][0],.4,nodes[a][1]),B=new THREE.Vector3(nodes[b][0],.4,nodes[b][1]),g=new THREE.BufferGeometry().setFromPoints([A,B]);
  var mat=broken?new THREE.LineDashedMaterial({color:col,dashSize:.7,gapSize:.5}):new THREE.LineBasicMaterial({color:col});var l=new THREE.Line(g,mat);if(broken)l.computeLineDistances();st.root.add(l);
  if(!broken)for(var i=0;i<3;i++)(function(i){var m=new THREE.Mesh(new THREE.BoxGeometry(.56,.56,.56),solid(col,col,.5));st.root.add(m);st.on(function(t){var u=(t*.2+i/3)%1;m.position.lerpVectors(A,B,u);m.position.y=.7;});})(i);
  else{var w=wireBox(1.2,1.2,1.2,C.amber);w.position.lerpVectors(A,B,.5);w.position.y=1;st.root.add(w);st.on(function(t){w.rotation.y=t;w.rotation.x=t*.6;});}}
 link('att','fw',C.red);link('fw','srv',C.red);link('srv','dst',C.amber,true);
 st.draw(2.1);return st;
};

S.bars=function(el,o){
 var st=new Stage(el,{fov:24,ry:-.32,rx:.56,bloomS:.3,bloomT:.74,drag:!o.mini});
 function fitB(a){st.camera.position.set(0,0,Math.max(o.mini?40:44,(o.mini?44:48)/(2*Math.tan(12*Math.PI/180)*a)));}fitB(st.camera.aspect);st.onResize=fitB;
 var data=o.data,bars=[];var sev={INFO:1.1,WARN:2.6,DENY:3.8,CRIT:6.2},colr={INFO:C.steel,WARN:C.amber,DENY:C.amber,CRIT:C.red};
 st.root.add(floorGrid(40,20,C.cyan,.16,0));
 data.forEach(function(l,i){var H=sev[l[2]],x=(i-(data.length-1)/2)*2.9;var c=colr[l[2]];
  var m=new THREE.Mesh(new THREE.BoxGeometry(1.9,H,1.9),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:l[2]==='INFO'?.1:.24,metalness:.2,roughness:.5}));m.position.set(x,H/2,0);st.root.add(m);
  var cap=wireBox(2.25,H+.3,2.25,C.green);cap.position.copy(m.position);cap.visible=false;st.root.add(cap);bars.push({id:l[0],m:m,w:cap,col:c,H:H});
  if(!o.mini){var t=label(l[1].slice(0,5),HEX.muted,.8);t.position.set(x,-.1,2.5);st.root.add(t);}});
 function apply(tags,sel){bars.forEach(function(b){var on=tags.indexOf(b.id)>=0;b.m.material.color.setHex(on?C.green:b.col);b.m.material.emissive.setHex(on?C.green:b.col);b.m.material.emissiveIntensity=on?.4:(b.col===C.steel?.1:.24);b.w.visible=on||sel===b.id;if(b.w.material)b.w.material.color.setHex(sel===b.id&&!on?C.amber:C.green);});}
 apply(o.tags||[],o.sel);st.update=function(u){apply(u.tags||[],u.sel);if(STATIC)st.draw(0);};
 st.root.position.y=-2;st.draw(1);return st;
};

S.layers=function(el,o){
 var st=new Stage(el,{fov:24,ry:-.12,rx:.1,bloomS:.25,bloomT:.8,drag:!o.mini});
 var L=[['bmVwdXZpciBjZXJn','ci4gcG5hbnk6IGZp','cC1vbnB4aGMgLT4g','Base64',C.amber,'#FFC23D'],['nepuvir cergr.','pnany: fip-onpxhc','srarger 23u47.','ROT13',C.cyan,'#38BDF8'],['archive prete.','canal: svc-backup','fenetre 23h47.','texte clair',C.green,'#3DFFA0']];
 var plates=L.map(function(d,i){var g=new THREE.Group();
  var c=document.createElement('canvas');c.width=1024;c.height=640;var x=c.getContext('2d');x.fillStyle='rgba(12,22,36,.96)';x.fillRect(0,0,1024,640);x.fillStyle=d[5];x.font='600 58px "JetBrains Mono",monospace';x.fillText(d[3],56,100);x.fillStyle='#E8F1F5';x.font='500 62px "JetBrains Mono",monospace';for(var r=0;r<3;r++)x.fillText(d[r],56,250+r*110);
  var t=new THREE.CanvasTexture(c);t.anisotropy=8;
  var mat=new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:1,side:THREE.DoubleSide});
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(12.8,8),mat));
  var e=wireBox(12.8,8,.02,d[4]);g.add(e);
  g.position.set((i-1)*15.4,0,0);g.rotation.y=.42;g.userData={mat:mat,e:e,x:g.position.x};st.root.add(g);return g;});
 [0,1].forEach(function(i){var a=new THREE.Vector3((i-1)*15.4+6.2,0,-1.2),b=new THREE.Vector3(i*15.4-6.2,0,1.2);st.root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:C.steel})));var p=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),solid(C.cyan,C.cyan,.4));st.root.add(p);st.on(function(t){p.position.lerpVectors(a,b,(t*.5+i*.5)%1);});});
 var n=o.n||0;
 st.on(function(t){plates.forEach(function(g,i){var cur=i===n,done=i<n,op=cur?1:done?.32:.55;g.userData.mat.opacity+=(op-g.userData.mat.opacity)*(STATIC?1:.08);var tz=cur?1:0;g.position.z+=(tz-g.position.z)*(STATIC?1:.08);g.position.y=Math.sin(t*.8+i)*.12;g.userData.e.material.transparent=true;g.userData.e.material.opacity=cur?1:.45;});});
 st.update=function(u){n=u.n||0;if(STATIC)st.draw(0);};
 function fit(a){st.camera.position.set(0,0,Math.max(o.mini?30:24,(o.mini?52:54)/(2*Math.tan(12*Math.PI/180)*a)));}fit(st.camera.aspect);st.onResize=fit;st.draw(1);return st;
};

S.chain=function(el,o){
 var st=new Stage(el,{fov:24,ry:-.14,rx:.26,bloomS:.3,bloomT:.72,drag:!o.mini});
 function fitC(a){st.camera.position.set(0,1,Math.max(o.mini?34:26,(o.mini?36:36)/(2*Math.tan(12*Math.PI/180)*a)));}fitC(st.camera.aspect);st.onResize=fitC;
 st.root.add(floorGrid(40,20,C.cyan,.16,-3));
 var pts=[],i;for(i=0;i<5;i++)pts.push(new THREE.Vector3((i-2)*6.6,Math.sin(i*1.25)*1.1,Math.cos(i*1.1)*3));
 var cv=new THREE.CatmullRomCurve3(pts);st.root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(cv.getPoints(120)),new THREE.LineBasicMaterial({color:C.cyan,transparent:true,opacity:.55})));
 var gates=pts.map(function(p,i){var r=new THREE.Mesh(new THREE.TorusGeometry(2.1,.09,10,4),new THREE.MeshStandardMaterial({color:C.amber,emissive:C.amber,emissiveIntensity:.35}));r.rotation.z=Math.PI/4;r.position.copy(p);r.rotation.y=Math.PI/2.4;st.root.add(r);
  var cb=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.3,1.3),solid(C.green,C.green,.3));cb.position.copy(p);st.root.add(cb);
  var w=wireBox(1.3,1.3,1.3,C.amber);w.position.copy(p);st.root.add(w);
  var t=null;return {r:r,cb:cb,w:w,p:p,lab:t};});
 var runner=new THREE.Mesh(new THREE.BoxGeometry(.44,.44,.44),solid(C.white,C.white,.4));st.root.add(runner);
 var cards=o.cards||{};function apply(ch){gates.forEach(function(g,i){var k=ch[i];g.cb.visible=!!k;g.w.visible=!k;var col=k?C.green:C.amber;g.r.material.color.setHex(col);g.r.material.emissive.setHex(col);if(g.lab){st.root.remove(g.lab);g.lab=null;}if(!o.mini){var l=label(k&&cards[k]?cards[k].id:('étape '+(i+1)),k?HEX.green:HEX.amber,1.15);l.position.copy(g.p);l.position.y+=3.1;st.root.add(l);g.lab=l;}});}
 apply(o.chain||[null,null,null,null,null]);
 st.on(function(t){gates.forEach(function(g,i){g.cb.rotation.y=t*.6+i;g.cb.rotation.x=t*.4+i;g.w.rotation.y=t*.6+i;g.w.rotation.x=t*.4+i;});runner.position.copy(cv.getPoint((t*.09)%1));});
 st.update=function(u){apply(u.chain||[]);if(STATIC)st.draw(0);};
 st.draw(1.4);return st;
};

/* Paquet réassemblé : le mot apparaît sur les faces */
S.word=function(el,o){
 var st=new Stage(el,{fov:20,ry:-.2,rx:.12,bloomS:.3,bloomT:.78,parallax:true});
 st.camera.position.set(0,0,o.z||62);
 var W=o.word,g=new THREE.BoxGeometry(2.05,2.05,2.05),arr=[];
 W.split('').forEach(function(ch,i){var side=new THREE.MeshStandardMaterial({color:0x1FB872,emissive:C.green,emissiveIntensity:.2,roughness:.5});var f=new THREE.MeshBasicMaterial({map:tex(ch,{size:192,fs:120,color:'#02120A',bg:'#3DFFA0',weight:800})});
  var m=new THREE.Mesh(g,[side,side,side,side,f,side]);m.position.x=(i-5.5)*2.55+(i>=5?.32:0);st.root.add(m);arr.push(m);});
 st.on(function(t){arr.forEach(function(m,i){m.position.y=Math.sin(t*1.2+i*.55)*.28;m.rotation.y=Math.sin(t*.7+i*.4)*.16;});});
 function fit(a){st.camera.position.z=Math.max(o.z||30,36/(2*Math.tan(10*Math.PI/180)*a));}fit(st.camera.aspect);st.onResize=fit;st.draw(1.2);return st;
};

S.voxel=function(el,o){ // avatars pixel en volume
 var st=new Stage(el,{fov:26,ry:-.55,rx:.3,bloomS:.3,bloomT:.72,spin:.35,drag:!o.small});
 st.camera.position.set(0,0,o.small?27:30);
 var rows=o.rows,col=o.color==='amber'?C.amber:C.green,cells=[];rows.forEach(function(r,y){r.split('').forEach(function(b,x){if(b==='1')cells.push([x,y]);});});
 var m=new THREE.InstancedMesh(new THREE.BoxGeometry(.92,.92,1.6),solid(col,col,.24),cells.length),d=new THREE.Object3D();cells.forEach(function(c,i){d.position.set(c[0]-3.5,3.5-c[1],0);d.updateMatrix();m.setMatrixAt(i,d.matrix);});st.root.add(m);
 st.draw(.6);return st;
};

S.logo=function(el,o){
 var st=new Stage(el,{fov:20,ry:-.18,rx:.14,parallax:true,bloomS:.32,bloomT:.68});
 var g=voxelLine('HACKADEMY',1,C.white,4,2.4,-3,.55);st.root.add(g);st.root.add(floorGrid(120,40,C.cyan,.16,-3.6));
 function fit(a){st.camera.position.set(0,1,Math.max(70,64/(2*Math.tan(10*Math.PI/180)*a)));}fit(st.camera.aspect);st.onResize=fit;
 st.on(function(t){if(g.userData.hollow)g.userData.hollow.visible=Math.sin(t*9)>-.96;});
 st.draw(1);return st;
};

/* ---------- API du module ---------- */
export const webglOk = ok;
export const SCENE_TYPES = Object.keys(S);

/** Crée une scène dans `el` et lance la boucle d'animation. Renvoie l'objet Stage (update, dispose). */
export function createScene(type, el, opts) {
  if (!S[type] || !ok()) return null;
  var st = S[type](el, opts || {});
  st.resize();
  start();
  return st;
}

/** Champ d'étoiles en arrière-plan de toutes les pages. */
export function createAmbient(el) {
  if (!ok()) return null;
  var st = S.ambient(el, {});
  start();
  return st;
}
