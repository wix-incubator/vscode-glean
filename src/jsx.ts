import { codeToAst } from "./parsing";
import { traverse } from "@babel/types";

export const createComponentFromSnipper = snipper => {
    const componentProperties = {};
    const Visitor = {
        MemberExpression(path) {
            if (path.node.object && path.node.property && path.node.object.type === 'ThisExpression') {
                if (path.parent.property) {
                    componentProperties[path.node.property.name].push(path.parent.property.name);
                } else {
                    componentProperties['props'].push(path.node.property.name);
                }
            }

        }
    }

    traverse(codeToAst(snipper), Visitor);
}