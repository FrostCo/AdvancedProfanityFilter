// TODO: Workaround to add module support for content scripts
// Source: https://stackoverflow.com/questions/48104433/how-to-import-es6-modules-in-content-script-for-chrome-extension/50764428#50764428
let exportVars, importVarsFrom; // the only line NOT within curly braces
{
  const modules = {};
  exportVars = varsObj => ({
    from(nameSpace) {
      modules[nameSpace] || (modules[nameSpace] = {});
      for (let [k,v] of Object.entries(varsObj)) {
        modules[nameSpace][k] = v;
      }
    }
  });
  importVarsFrom = nameSpace => modules[nameSpace];
}