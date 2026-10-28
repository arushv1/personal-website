// Research figures supplied by Arush in Vyas.Arush.Final.pptx.
// Add a new figure here and place its original image in public/vascupath/.
// Reuse a viewGroup only for aligned views of the same source section.
export const vascupathFigures=[
 {
  id:'original',label:'Original',src:'/vascupath/original.jpg',width:1400,height:868,viewGroup:'tissue',
  alt:'Original stained brain tissue section from the VascuPath research presentation.',
  caption:'The original stained tissue section used for the tile-prediction example.',
 },
 {
  id:'predictions',label:'Predictions',src:'/vascupath/predictions.jpg',width:1400,height:870,viewGroup:'tissue',
  alt:'Tile-level predictions over the tissue section: blue white matter, pink grey matter and red vessel tiles.',
  caption:'Tile-level model predictions classify white matter, grey matter and vessels.',
  legend:[{label:'White matter',color:'#4841f7'},{label:'Grey matter',color:'#f2a4b8'},{label:'Vessel',color:'#e7383a'}],
 },
 {
  id:'attention',label:'Attention',src:'/vascupath/attention.png',width:612,height:432,viewGroup:'attention',initialRegion:{u:.72,v:.28},
  alt:'Two research examples showing original tissue beside attention-percentile maps, with the source percentile-rank color scale.',
  caption:'Attention maps show the regions emphasized by the model. This separate figure includes its original tissue examples and percentile scale.',
 },
];
