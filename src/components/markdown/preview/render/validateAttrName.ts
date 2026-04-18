const attrNameReg = /^[a-zA-Z_:][a-zA-Z0-9:._-]*$/;

export const validateAttrName = (name: string) => {
    return attrNameReg.test(name) && !/^on/i.test(name);
};
