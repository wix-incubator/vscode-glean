import template from "@babel/template";

export const buildStateHook = template(`
const [STATE_PROP, STATE_SETTER] = useState(STATE_VALUE);
`);

export const buildRefHook = template(`
const VAR_NAME = useRef(INITIAL_VALUE);
`);

export const buildEffectHook = template(`
useEffect(() =>  { EFFECT });
`);

export const buildUseCallbackHook = template(`
useCallback(CALLBACK);
`);
export const buildUseMemo= template(`
const VAR = useMemo(() => EXPRESSION);
`);
