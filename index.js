function GlobalModel(
    parrentKey,
    key = "gProperty",
    initialValue,
    structure,
    value,
){
    // Уникальный ключ
    this.gKey = parrentKey ? `${parrentKey}/${key}` : key;
    
    // Изначальное состояние
    this.gInitialValue = initialValue;

    // Значение
    this.gValue = value !== undefined ? value : initialValue;

    // Тип
    this.gType = this.gTypeof(this.gValue);

    // Структура
    this.gStructure = structure;
    
    // Методы управления
    this.gActions = {
        reset: {
            type: `RESET`,
            func: (key) => ({type: `RESET`, key})
        },
        update: {
            type: `UPDATE`,
            func: (key, value) => ({type: `UPDATE`, key, value})
        },
        toggle: {
            type: `TOGGLE`,
            func: (key) => ({type: `TOGGLE`, key})
        },
        drop: {
            type: `DROP`,
            func: (key) => ({type: `DROP`, key})
        },
        unshift: {
            type: `UNSHIFT`,
            func: (key, ...value) => ({type: `UNSHIFT`, key, value})
        },
        push: {
            type: `PUSH`,
            func: (key, value) => ({type: `PUSH`, key, value})
        },
        filter: {
            type: `FILTER`,
            func: (key, callback) => ({type: `FILTER`, key, callback})
        },
        sort: {
            type: `SORT`,
            func: (key, callback) => ({type: `SORT`, key, callback})
        },
    }

    this.gReset = this.gActions.reset.func;
    this.gUpdate = this.gActions.update.func;
    this.gToggle = this.gActions.toggle.func;
    this.gDrop = this.gActions.drop.func;
    this.gPush = this.gActions.push.func;
    this.gUnshift = this.gActions.unshift.func;
    this.gFilter = this.gActions.filter.func;
    this.gSort = this.gActions.sort.func;

    switch(this.gType){
        case "Object":
            if(this.gStructure === undefined){
                Object.keys(this.gValue).forEach(k => {
                    this[k] = new GlobalModel(
                        this.gKey,
                        k,
                        this.gValue[k],
                        undefined,
                        this.gValue !== undefined ? this.gValue[k] : undefined,
                    )
                });

            }else{
                Object.keys(this.gStructure).forEach(k => {
                    let childStructure = this.gTypeof(this.gStructure[k]) === "Array"
                        ?  [] : this.gStructure[k];

                    this[k] = new GlobalModel(
                        this.gKey,
                        k,
                        this.gInitialValue[k] !== undefined ? this.gInitialValue[k] : childStructure,
                        this.gStructure[k],
                        this.gValue !== undefined ? this.gValue[k] : undefined,
                    )
                });
            }
        break;

        case "Array":
            Object.keys(this.gValue).forEach(k => {
                this[k] = new GlobalModel(
                    this.gKey,
                    k,
                    this.gValue[k],
                    this.gStructure !== undefined ? this.gStructure[0] : undefined,
                    this.gValue !== undefined ? this.gValue[k] : undefined,
                )
            });
        break;

        case "GlobalModel":
            throw new Error("GlobalModel: Нельзя передавать в GlobalModel его экземпляр!");
    }
};

GlobalModel.prototype.gTypeof = function(object){
    let type = Object.prototype.toString.call(object).slice(8, -1);

    return type === "Object" ? object.constructor.name : type;
}

GlobalModel.prototype.gReducer = function(action){
    let newValue;

    if(action){
        if(this.gKey === action.key){
            switch(action.type){
                case this.gActions.reset.type:
                    newValue = this.gInitialValue;
                break;
    
                case this.gActions.update.type:
                    if(this.gType === this.gTypeof(action.value)){
                        newValue = action.value;

                    }else if(this.gType === "Null"
                                && this.gTypeof(action.value) === "String"
                                    || this.gTypeof(action.value) === "Number"
                                    || this.gTypeof(action.value) === "Boolean"){
                        newValue = action.value;

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != ${this.gTypeof(action.value)}`
                        );
                    }
                break;
    
                case this.gActions.toggle.type:
                    if(this.gType === "Boolean"){
                        newValue = !this.gValue;

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != Boolean`
                        );
                    }
                break;
    
                case this.gActions.drop.type:
                    newValue = "♱death_certificate♱";
                break;
    
                case this.gActions.unshift.type:
                    if(this.gType === "Array"){
                        newValue = [...action.value, ...this.gValue];

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != Array`
                        );
                    }
                break;
    
                case this.gActions.push.type:
                    if(this.gType === "Array"){
                        newValue = [...this.gValue,  action.value];

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != Array`
                        );
                    }
                break;
    
                case this.gActions.filter.type:
                    if(this.gType === "Array"){
                        newValue = this.gValue.filter(action.callback);

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != Array`
                        );
                    }
                break;
    
                case this.gActions.sort.type:
                    if(this.gType === "Array"){
                        newValue = this.gValue.sort(action.callback);

                    }else{
                        console.warn(
                            `GlobalModel: typeError - ${this.gType} != Array`
                        );
                    }
                break;
            }
        }
    }

    if(newValue === undefined){
        switch(this.gType){
            case "Object":
                if(this.gStructure === undefined){
                    newValue = Object.keys(this.gValue).reduce((o, k) => {
                        if(this[k] && this[k].gReducer){
                            let childGM = this[k].gReducer(action);
    
                            return childGM ? {...o, [k]: childGM.gValue} : o;

                        }else{
                            return o;
                        }
                    }, {});
    
                }else{
                    newValue = Object.keys(this.gStructure).reduce((o, k) => {
                        if(this[k] && this[k].gReducer){
                            let childGM = this[k].gReducer(action);
    
                            return childGM ? {...o, [k]: childGM.gValue} : o;
                            
                        }else{
                            return o;
                        }
                    }, {});
                }
            break;
    
            case "Array":
                newValue = Object.keys(this.gValue).reduce((a, k) => {
                    if(this[k] && this[k].gReducer){
                        let childGM = this[k].gReducer(action);

                        return childGM ? [...a, childGM.gValue] : a;
                    }else{
                        return a;
                    }
                }, []);
            break;
        }

    }else if(newValue === "♱death_certificate♱"){
        return null;
    }
    
    return new GlobalModel(
        false, this.gKey, this.gInitialValue, this.gStructure, newValue
    );
}

module.exports = GlobalModel ;