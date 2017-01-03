import {isObject, getObject} from "./utils";
require("object.observe/dist/object-observe-lite");

let callOnchange = function callOnchange(ctx, oldCtx, target, name, val) {
    if(ctx && ctx.onChange && typeof ctx.onChange === "function"){
        ctx.onChange(getObject(ctx), getObject(target), name, val);
    }
};

let callOnChangeLegacy = function callOnChangeLegacy(ctx){

    return function(changeArray){
        if(ctx && ctx.onChange && typeof ctx.onChange === "function"){
            changeArray.forEach((changeObj)=>{
                ctx.onChange(ctx, changeObj.object, changeObj.name, changeObj.object[changeObj.name]);
            });
        }
    }
};


let proxyHandler = function(ctx) {
    return {
        get: function(target, prop, receiver) {
            try {
                return (isObject(target[prop]) && "___value" in target[prop]) ? target[prop].___value : target[prop];
            } catch (e) {
                return;
            }
        },

        set: function(target, name, value) {
            let oldVal = getObject(ctx);

            if (Array.isArray(value)) {
                target[name] = value;
                callOnchange(ctx, oldVal, target, name, value);
                return target;
            }

            if (isObject(value) && !Array.isArray(value)) {
                Object.keys(value).forEach((key) => {
                    target[name] = new Proxy(ObservuI(value, {}), proxyHandler);
                })
            }

            if (Array.isArray(value)) {
                target[name] = new Proxy(value, proxyHandler);
            }

            if (!isObject(value)) {
                target[name] = new Proxy({
                    ___value: value
                }, proxyHandler);
            }

            callOnchange(ctx, oldVal, target, name, value);
        }
    }
};

let ObservuI = function ObservuI(state, that, originalState) {
    if (isObject(state) && !Array.isArray(state)) {
        Object.keys(state).forEach((key) => {
            that[key] = new Proxy(ObservuI(state[key], {}, originalState), proxyHandler(originalState));
        })
    }

    if (Array.isArray(state)) {
        return new Proxy(state, proxyHandler(originalState));
    }

    if (!isObject(state)) {
        return new Proxy({
            ___value: state
        }, proxyHandler(originalState));
    }

    return that;
};

let ObservuILegacy = function(state, that, originalState, callOnChangeLegacy){

    if (isObject(state)) {
        Object.keys(state).forEach((key) => {
            if(typeof state[key] === "object"){
                that[key] = Object.observe(ObservuILegacy(state[key], {}, originalState, callOnChangeLegacy), callOnChangeLegacy);
            } else {
                that[key] = state[key];
            }

        })
    }

    if (!isObject(state)) {
        return state;
    }

    return that;
};

let Observu = function Observu(state) {
    let isProxyAvailable = (typeof Proxy === "function");
    let newState = {};

    if(!isProxyAvailable){
        callOnChangeLegacy = callOnChangeLegacy(newState);
    }

    let observableState = isProxyAvailable ? ObservuI(state, newState, newState) : Object.observe(ObservuILegacy(state, newState, newState, callOnChangeLegacy), callOnChangeLegacy);
    return observableState;
};

export default Observu;