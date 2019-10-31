import { codeToAst, templateToAst } from "../parsing";
import traverse from "@babel/traverse";
import template from "@babel/template";
import * as t from "@babel/types";
import { transformFromAst } from "@babel/core";
import { capitalizeFirstLetter } from "../utils";
import {
  isHooksForFunctionalComponentsExperimentOn,
  shouldShowConversionWarning
} from "../settings";
import { getReactImportReference, isExportedDeclaration } from "../ast-helpers";
import {
  showInformationMessage,
  selectedText,
  activeURI,
  activeFileName,
  openFile
} from "../editor";
import { replaceSelectionWith, handleError } from "../code-actions";
import {
  persistFileSystemChanges,
  readFileContent,
  replaceTextInFile
} from "../file-system";
import { Position } from "vscode";
import { Identifier } from "babel-types";

const buildStateHook = template(`
const [STATE_PROP, STATE_SETTER] = useState(STATE_VALUE);
`);

const buildRefHook = template(`
const VAR_NAME = useRef(INITIAL_VALUE);
`);

const buildEffectHook = template(`
useEffect(() =>  { EFFECT });
`);

const buildUseCallbackHook = template(`
useCallback(CALLBACK);
`);

export function statefulToStateless(component) {
  const functionBody = [];
  const stateProperties = new Map();
  const refProperties = new Map();
  const RemoveThisVisitor = {
    MemberExpression(path) {
      if (path.node.wasVisited || path.shouldSkip) return;
      if (
        isHooksForFunctionalComponentsExperimentOn() &&
        path.key !== "callee"
      ) {
        if (
          t.isIdentifier(path.node.property) &&
          !["state", "props"].includes(path.node.property.name)
        ) {
          if (!refProperties.has(path.node.property.name)) {
            refProperties.set(path.node.property.name, undefined);
          }
        }

        const replacement = t.memberExpression(
          t.identifier(path.node.property.name),
          t.identifier("current")
        );

        (replacement as any).wasVisited = true;

        path.replaceWith(replacement);

        path.skip();
      } else {
        if (t.isThisExpression(path.node.object)) {
          path.replaceWith(path.node.property);
        }
      }
    }
  };

  const ReplaceStateWithPropsVisitor = {
    MemberExpression(path) {
      if (isHooksForFunctionalComponentsExperimentOn()) {
        if (
          t.isThisExpression(path.node.object.object) &&
          path.node.object.property.name === "state"
        ) {
          const stateVariable = path.node.property.name;
          if (!stateProperties.has(stateVariable)) {
            stateProperties.set(stateVariable, void 0);
          }
          path.replaceWith(t.identifier(stateVariable));
        }
      } else {
        if (
          t.isThisExpression(path.node.object) &&
          path.node.property.name === "state"
        ) {
          path.node.property.name = "props";
        }
      }
    }
  };

  const RemoveSetStateAndForceUpdateVisitor = {
    CallExpression(path) {
      if (
        t.isMemberExpression(path.node.callee) &&
        t.isThisExpression(path.node.callee.object)
      ) {
        if (isHooksForFunctionalComponentsExperimentOn()) {
          if (path.node.callee.property.name === "forceUpdate") {
            path.remove();
          } else if (path.node.callee.property.name === "setState") {
            const buildRequire = template(`
              STATE_SETTER(STATE_VALUE);
            `);

            if (isStateChangedThroughFunction(path.node.arguments[0])) {
              covertStateChangeThroughFunction(
                path,
                buildRequire,
                stateProperties
              );
            } else {
              convertStateChangeThroughObject(
                path,
                buildRequire,
                stateProperties
              );
            }

            path.remove();
          }
        } else {
          if (
            ["setState", "forceUpdate"].indexOf(
              path.node.callee.property.name
            ) !== -1
          ) {
            path.remove();
          }
        }
      }
    }
  };

  let nonLifeycleMethodsPresent = false;

  let effectBody, effectTeardown;

  const lifecycleMethods = [
    "constructor",
    "componentWillMount",
    "componentDidMount",
    "componentWillReceiveProps",
    "shouldComponentUpdate",
    "componentWillUpdate",
    "componentDidUpdate",
    "componentWillUnmount",
    "componentDidCatch",
    "getDerivedStateFromProps"
  ];

  const namedArrowFunction = ({
    name,
    params = [],
    propType = null,
    paramDefaults = [],
    body = [],
    arrowFunctionCreator = arrowFunction
  }) => {
    const identifier = t.identifier(name);
    addPropTSAnnotationIfNeeded(propType, identifier);
    return t.variableDeclaration("const", [
      t.variableDeclarator(
        identifier,
        arrowFunctionCreator(params, paramDefaults, body)
      )
    ]);
  };

  const copyNonLifeCycleMethods = path => {
    const methodName = path.node.key.name;
    const classBody = t.isClassMethod(path)
      ? path["node"].body.body
      : path.node.value.body.body;
    if (!lifecycleMethods.includes(methodName)) {
      path.traverse(RemoveSetStateAndForceUpdateVisitor);
      path.traverse(ReplaceStateWithPropsVisitor);
      path.traverse(RemoveThisVisitor);
      appendFunctionBodyToStatelessComponent(methodName, classBody);
    } else if (isHooksForFunctionalComponentsExperimentOn()) {
      if (methodName === "componentDidMount") {
        path.traverse(RemoveSetStateAndForceUpdateVisitor);
        path.traverse(ReplaceStateWithPropsVisitor);
        path.traverse(RemoveThisVisitor);

        effectBody = path.node.body;
      } else if (methodName === "componentWillUnmount") {
        path.traverse(RemoveSetStateAndForceUpdateVisitor);
        path.traverse(ReplaceStateWithPropsVisitor);
        path.traverse(RemoveThisVisitor);

        effectTeardown = path.node.body;
      }
    }
  };

  const appendFunctionBodyToStatelessComponent = (name, body) => {
    if (name !== "render") {
      if (isHooksForFunctionalComponentsExperimentOn()) {
        functionBody.push(
          namedArrowFunction({
            name,
            body,
            arrowFunctionCreator: (params, paramDefaults, arrowBody) =>
              buildUseCallbackHook({
                CALLBACK: arrowFunction(params, paramDefaults, arrowBody)
              }).expression
          })
        );
      } else {
        functionBody.push(namedArrowFunction({ name, body }));
      }
    } else {
      functionBody.push(...body);
    }
  };

  const visitor = {
    ClassDeclaration(path) {
      const statelessComponentName = path.node.id.name;
      const defaultPropsPath = path
        .get("body")
        .get("body")
        .find(property => {
          return (
            t.isClassProperty(property) &&
            property["node"].key.name === "defaultProps"
          );
        });

      const statelessComponent = namedArrowFunction({
        name: statelessComponentName,
        params: ["props"],
        propType:
          path.node.superTypeParameters &&
          path.node.superTypeParameters.params.length
            ? path.node.superTypeParameters.params
            : null,
        paramDefaults: defaultPropsPath ? [defaultPropsPath.node.value] : [],
        body: functionBody
      });

      const isExportDefaultDeclaration = t.isExportDefaultDeclaration(
        path.container
      );
      const isExportNamedDeclaration = t.isExportNamedDeclaration(
        path.container
      );

      const exportDefaultStatelessComponent = t.exportDefaultDeclaration(
        t.identifier(statelessComponentName)
      );
      const exportNamedStatelessComponent = t.exportNamedDeclaration(
        statelessComponent,
        []
      );

      const mainPath = t.isExportDeclaration(path.container)
        ? path.findParent(p => t.isExportDeclaration(p))
        : path;

      if (isExportDefaultDeclaration) {
        mainPath.insertBefore(statelessComponent);
        mainPath.insertBefore(exportDefaultStatelessComponent);
      } else if (isExportNamedDeclaration) {
        mainPath.insertBefore(exportNamedStatelessComponent);
      } else {
        mainPath.insertBefore(statelessComponent);
      }
    },
    ClassMethod(path) {
      if (isHooksForFunctionalComponentsExperimentOn()) {
        const methodName = path.node.key.name;
        if (!lifecycleMethods.includes(methodName) && methodName !== "render") {
          nonLifeycleMethodsPresent = true;
        }
        if (path.node.kind === "constructor") {
          const { expression = null } =
            path.node.body.body.find(bodyStatement => {
              return t.isAssignmentExpression(bodyStatement.expression);
            }) || {};

          if (expression && expression.left.property.name === "state") {
            expression.right.properties.map(({ key, value }) => {
              stateProperties.set(key.name, value);
            });
          }
        }
      }

      copyNonLifeCycleMethods(path);
    },
    ClassProperty(path) {
      const propValue = path.node.value;
      if (
        t.isFunctionExpression(propValue) ||
        t.isArrowFunctionExpression(propValue)
      ) {
        copyNonLifeCycleMethods(path);
      } else {
        refProperties.set(path.node.key.name, path.node.value);
      }
      if (t.isObjectExpression(propValue) && path.node.key.name === "state") {
        (propValue.properties as t.ObjectProperty[]).map(({ key, value }) => {
          stateProperties.set(key.name, value);
        });
      }
    },

    ImportDeclaration(path) {
      if (path.node.source.value === "react") {
      }
    }
  };

  const ast = codeToAst(component);
  const hasComponentDidUpdate = node => {
    const classDeclaration = isExportedDeclaration(node)
      ? node.declaration
      : ast.program.body[0];
    return Boolean(
      (classDeclaration as any).body.body.find(
        node =>
          t.isClassMethod(node) &&
          (node.key as any).name === "componentDidUpdate"
      )
    );
  };

  traverse(ast, visitor);

  if (isHooksForFunctionalComponentsExperimentOn()) {
    const refHookExpression = Array.from(refProperties).map(
      ([key, defaultValue]) => {
        return buildRefHook({
          VAR_NAME: t.identifier(key),
          INITIAL_VALUE: defaultValue
        });
      }
    );

    functionBody.unshift(...refHookExpression);

    if (effectBody || effectTeardown) {
      const expressions = [];
      if (effectBody) {
        expressions.push(...effectBody.body);
      }

      if (effectTeardown) {
        expressions.push(
          t.returnStatement(t.arrowFunctionExpression([], effectTeardown))
        );
      }

      const lifecycleEffectHook = buildEffectHook({ EFFECT: expressions });

      lifecycleEffectHook.expression.arguments.push(t.arrayExpression([]));

      functionBody.unshift(lifecycleEffectHook);
    }

    const hookExpressions = Array.from(stateProperties).map(
      ([key, defaultValue]) => {
        return buildStateHook({
          STATE_PROP: t.identifier(key),
          STATE_SETTER: t.identifier(`set${capitalizeFirstLetter(key)}`),
          STATE_VALUE: defaultValue
        });
      }
    );
    functionBody.unshift(...hookExpressions);
  }

  ast.program.body.splice(-1);

  const processedJSX = transformFromAst(ast).code;

  return {
    text: processedJSX,
    metadata: {
      stateHooksPresent: stateProperties.size > 0,
      refHooksPresent: refProperties.size > 0,
      nonLifeycleMethodsPresent
    }
  };
}
function isStateChangedThroughFunction(setStateArg: any) {
  return (
    t.isFunctionExpression(setStateArg) ||
    t.isArrowFunctionExpression(setStateArg)
  );
}

function convertStateChangeThroughObject(
  path: any,
  buildRequire: any,
  stateProperties: Map<any, any>
) {
  path.node.arguments[0].properties.forEach(({ key, value }) => {
    path.insertBefore(
      buildRequire({
        STATE_SETTER: t.identifier(`set${capitalizeFirstLetter(key.name)}`),
        STATE_VALUE: value
      })
    );
    if (!stateProperties.has(key.name)) {
      stateProperties.set(key.name, void 0);
    }
  });
}

function covertStateChangeThroughFunction(
  path: any,
  buildRequire: any,
  stateProperties
) {
  const stateProducer = path.node.arguments[0];
  const stateProducerArg = stateProducer.params[0];
  const isPrevStateDestructured = t.isObjectPattern(stateProducerArg);
  if (!isPrevStateDestructured) {
    path.traverse({
      Identifier(nestedPath) {
        if (nestedPath.listKey === "params") {
          (Object.values(
            nestedPath.scope.bindings
          )[0] as any).referencePaths.forEach(ref => {
            ref.parentPath.replaceWith(ref.container.property);
          });
        }
      }
    });
  }

  let stateUpdates;
  if (t.isObjectExpression(stateProducer.body)) {
    stateUpdates = stateProducer.body.properties;
  } else {
    stateUpdates = stateProducer.body.body.find(exp => t.isReturnStatement(exp))
      .argument.properties;
  }
  stateUpdates.forEach(prop => {
    const fn = arrowFunction(
      [prop.key.name],
      [],
      [t.returnStatement(prop.value)]
    );

    traverse(
      fn,
      {
        Identifier(ss) {
          if (ss.node.name === prop.key.name && ss.key !== "key") {
            ss.node.name = `prev${capitalizeFirstLetter(prop.key.name)}`;
          }
        }
      },
      path.scope,
      path
    );

    path.insertBefore(
      buildRequire({
        STATE_SETTER: t.identifier(
          `set${capitalizeFirstLetter(prop.key.name)}`
        ),
        STATE_VALUE: fn
      })
    );

    if (!stateProperties.has(prop.key.name)) {
      stateProperties.set(prop.key.name, void 0);
    }
  });
}

function arrowFunction(
  params: any[],
  paramDefaults: any[],
  body: any[]
): t.Expression {
  return t.arrowFunctionExpression(
    params.map((param, idx) => {
      const paramIdentifier = t.identifier(param);
      let paramObj: any = paramIdentifier;
      if (paramDefaults[idx]) {
        paramObj = t.assignmentPattern(paramIdentifier, paramDefaults[idx]);
      }
      return paramObj;
    }),
    t.blockStatement(body)
  );
}

function addPropTSAnnotationIfNeeded(
  typeAnnotation: any,
  identifier: t.Identifier
) {
  if (typeAnnotation) {
    identifier.typeAnnotation = resolveTypeAnnotation(typeAnnotation);
  }
}

function resolveTypeAnnotation(propType: any) {
  let typeAnnotation;
  const hasTypeReferences = propType.some(annotation =>
    t.isTSTypeReference(annotation)
  );
  if (hasTypeReferences) {
    if (propType.length > 1) {
      typeAnnotation = t.tsIntersectionType(propType);
    } else {
      typeAnnotation = propType[0];
    }
  } else {
    const members = propType.reduce((acc, typeLiteral) => {
      return [...acc, ...typeLiteral.members];
    }, []);
    typeAnnotation = t.tsTypeLiteral(members);
  }
  const componentTypeAnnotation = isHooksForFunctionalComponentsExperimentOn()
    ? "FC"
    : "SFC";
  return t.tsTypeAnnotation(
    t.tsTypeReference(
      t.identifier(componentTypeAnnotation),
      t.tsTypeParameterInstantiation([typeAnnotation])
    )
  );
}

export async function statefulToStatelessComponent() {
  try {
    const answer = shouldShowConversionWarning()
      ? await showInformationMessage(
          "WARNING! All lifecycle methods and react instance methods would be removed. Are you sure you want to continue?",
          ["Yes", "No"]
        )
      : "Yes";

    if (answer === "Yes") {
      const selectionProccessingResult = statefulToStateless(selectedText());
      const persistantChanges = [
        replaceSelectionWith(selectionProccessingResult.text)
      ];

      const {
        stateHooksPresent,
        refHooksPresent,
        nonLifeycleMethodsPresent
      } = selectionProccessingResult.metadata;
      const usedHooks = [
        ...(stateHooksPresent ? ["useState"] : []),
        ...(refHooksPresent ? ["useRef"] : []),
        ...(nonLifeycleMethodsPresent ? ["useCallback"] : [])
      ];

      if (usedHooks.length) {
        persistantChanges.push(importHooks(...usedHooks));
      }

      await persistFileSystemChanges(...persistantChanges);
    }
  } catch (e) {
    handleError(e);
  }

  function importHooks(...hooks) {
    const currentFile = activeURI().fsPath;
    const file = readFileContent(currentFile);
    const ast = codeToAst(file);
    const reactImport = getReactImportReference(ast);
    hooks.forEach(hook => {
      reactImport.specifiers.push(
        t.importSpecifier(t.identifier(hook), t.identifier(hook))
      );
    });

    const updatedReactImport = transformFromAst(t.program([reactImport])).code;
    return replaceTextInFile(
      updatedReactImport,
      new Position(reactImport.loc.start.line, reactImport.loc.start.column),
      new Position(reactImport.loc.end.line, reactImport.loc.end.column),
      activeFileName()
    );
  }
}

export function isStatefulComp(code) {
  const ast = templateToAst(code);

  const isSupportedComponent = classPath => {
    const supportedComponents = ["Component", "PureComponent"];

    if (!classPath) {
      return false;
    }

    return (
      classPath.superClass &&
      ((classPath.superClass.object &&
        classPath.superClass.object.name === "React" &&
        supportedComponents.indexOf(classPath.superClass.property.name) !==
          -1) ||
        supportedComponents.indexOf(classPath.superClass.name) !== -1)
    );
  };

  return (
    (isExportedDeclaration(ast) && isSupportedComponent(ast.declaration)) ||
    isSupportedComponent(ast)
  );
}
