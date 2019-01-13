import { ComponentProperties } from './jsx';
import template from '@babel/template';

function buildFunctionalComponent(name, code, attributes: ComponentProperties) {
  const props = new Set([...attributes.argumentProps, ...attributes.componentMembers]);
  return `
    function ${name}({${Array.from(props).join(', ')}}) {
      return (${code});
    }
  `;
}

function buildStatefulComponent(name, code, attributes: ComponentProperties) {
  const componentProps = new Set([...attributes.state, ...attributes.componentMembers]);
  return `class ${name} extends React.Component {
      render() {
        ${componentProps && componentProps.size ?
          `const {${Array.from(componentProps).join(',')}} = this.props`
          : ''
    }

        return (${code})
      }
    }
    `;
}

export function buildComponent(name, code, attributes: ComponentProperties) {

  if (attributes.memberProps.size || attributes.state.size) {
    return buildStatefulComponent(name, code, attributes);
  } else {
    return buildFunctionalComponent(name, code, attributes);
  }
}
