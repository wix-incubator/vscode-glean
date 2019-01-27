import template from "@babel/template";
import outdent from "outdent";

function buildFunctionalComponent(name, code, props) {
  return outdent`
    function ${name}({${Array.from(props).join(", ")}}) {
      return (${code});
    } 
  `;
}

export function buildComponent(name, code, allProps) {
  return buildFunctionalComponent(name, code, allProps);
}
