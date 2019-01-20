import template from "@babel/template";

function buildFunctionalComponent(name, code, props) {
  return `
    function ${name}({${Array.from(props).join(", ")}}) {
      return (${code});
    } 
  `;
}

function buildStatefulComponent(name, code, attributes) {
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
  if (attributes.memberProps.size || attributes.state.size) {
    return buildStatefulComponent(name, code, attributes);
  } else {
    return buildFunctionalComponent(name, code, attributes.argumentProps);
  }
}
