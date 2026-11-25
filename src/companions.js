export const companions = Object.fromEntries(
  [['bear','Bear'],['cat','Cat'],['bunny','Bunny'],['panda','Panda']].map(([id,label]) => [id, {
    id, label,
    model: new URL(`../assets/scenes/${id}-station.glb`, import.meta.url).href,
    poster: new URL(`../assets/scenes/${id}-poster.png`, import.meta.url).href
  }])
);
