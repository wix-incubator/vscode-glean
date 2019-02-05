import template from "@babel/template";
import { ComponentProperties } from "./jsx";

function buildFunctionalComponent(name, code, attributes: ComponentProperties) {
  const props = new Set([
    ...attributes.argumentProps,
    ...attributes.componentMembers,
    ...attributes.memberProps,
    ...attributes.state

  ]);
  return `
    function ${name}({${Array.from(props).join(", ")}}) {
      return (${code});
    }
  `;
}

function buildStatefulComponent(name, code, attributes: ComponentProperties) {
  return `class ${name} extends React.Component {
      render() {

        ${
          attributes.argumentProps && attributes.argumentProps.size
            ? `const {${Array.from(attributes.argumentProps).join(
                ","
              )}} = this.props`
            : ""
        }

        return (${code})
      }
    }
    `;
}

export function buildComponent(name, code, attributes) {
    return buildFunctionalComponent(name, code, attributes);
}
