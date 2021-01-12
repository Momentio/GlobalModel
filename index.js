
export default class GlobalModel{
    constructor(
        parrentPropertyKey, key = "property", initialState = undefined
    ){
        // Уникальный ключ модели
        
        if(parrentPropertyKey){
            this._propertyKey = `${parrentPropertyKey}/${key}`;

        }else{
            this._propertyKey = key;
        }
        
        // Изначальное состояние модели
        this._initialState = initialState;
        
        // Методы управления моделью
        this._actions = {
            reset: {
                type: `RESET`,
                exec: (propertyKey)=>{
                    return {
                        type: `RESET`,
                        propertyKey
                    }
                }
            },
            update: {
                type: `UPDATE`,
                exec: (propertyKey, value)=>{
                    return {
                        type: `UPDATE`,
                        propertyKey,
                        value
                    }
                }
            },
            toggle: {
                type: `TOGGLE`,
                exec: (propertyKey)=>{
                    return {
                        type: `TOGGLE`,
                        propertyKey
                    }
                }
            },
        }
    }

    oftype = (value) => {
        if(value){
            if(value._propertyKey) return "model";
        }
    
        if(typeof value === "object"){
            if(value.constructor === Array){
                return "array";

            }else{
                return "object";
            }

        }else{
            return typeof value;
        }
    }

    // Возвращает текущее значение модели
    reducer = (state, action)=>{
        let nextValue;
        let _propertyKey;
        let _actions;

        if(this.oftype(state) === "model"){
            nextValue = state._value;
            _propertyKey = state._propertyKey;
            _actions = state._actions;

        }else{
            state = this._initialState;
            nextValue = state;
            _propertyKey = this._propertyKey;
            _actions = this._actions;
        }

        if(_propertyKey === action.propertyKey){
            switch(action.type){
                case _actions.reset.type:
                    nextValue = this._initialState;
                break;
    
                case _actions.update.type:
                    nextValue = action.value;
                    console.log(_propertyKey, nextValue);
                break;
    
                case _actions.toggle.type:
                    nextValue = !state;
                break;
            }
        }


        let result;

        switch(this.oftype(state)){
            case "model":
                if(state.reducer){
                    result = state.reducer(undefined, action);
                    
                }else{
                    result = Object.keys(state).reduce(
                        (result, key) => {
                            if(key === "_propertyKey"
                                || key === "_initialState"
                                || key === "_actions"
                                || key === "_value"
                                || key === "reducer"
                                || key === "oftype"
                                || key === "_timestamp"){
                                    return result;
                                }
                                
                            return Object.assign(
                                result,
                                {
                                    [key]: this.reducer(
                                        state[key],
                                        action
                                    ),
                                }
                            );
                        }, {
                            _propertyKey: state._propertyKey,
                            _initialState: state._initialState,
                            _actions: state._actions,
                            _value: nextValue,
                            _timestamp: new Date().toLocaleTimeString()
                        }
                    );

                    switch(this.oftype(result._value)){
                        case "object":
                            result._value = Object.keys(result._value).reduce(
                                (value, key) => {
                                    return Object.assign(
                                        value,
                                        {
                                            [key]: result[key]._value,
                                        }
                                    );
                                }, result._value 
                            );
                        break;

                        // case "array":
                        //     result._value = Object.keys(result._value).reduce(
                        //         (value, key) => {
                        //             return Object.assign(
                        //                 value,
                        //                 {
                        //                     [key]: result[key]._value,
                        //                 }
                        //             );
                        //         }, result._value 
                        //     );
                        // break;
                    }
                }
            break;

            case "object":
                result = Object.keys(state).reduce(
                    (result, key) => {
                        return Object.assign(
                            result,
                            {
                                [key]: new GlobalModel(
                                    this._propertyKey, key, state[key]
                                ).reducer(
                                    state[key], action
                                )
                            }
                        );
                    }, {
                        _propertyKey: this._propertyKey,
                        _initialState: this._initialState,
                        _actions: this._actions,
                        _value: nextValue,
                        _timestamp: new Date().toLocaleTimeString()
                    }
                );
            break;

            case "array":
                let models = state.map((property, index) => {
                    return new GlobalModel(
                        this._propertyKey, index, property
                    ).reducer(
                        property, action
                    );
                });

                result = Object.keys(models).reduce(
                    (result, key) => {
                        return Object.assign(result, {[key]: models[key]});
                    }, {
                        _propertyKey: this._propertyKey,
                        _initialState: this._initialState,
                        _actions: this._actions,
                        _value: nextValue,
                        _timestamp: new Date().toLocaleTimeString()
                    }
                );
            break;

            default:
                result = {
                    _propertyKey: this._propertyKey,
                    _initialState: this._initialState,
                    _actions: this._actions,
                    _value: nextValue,
                    _timestamp: new Date().toLocaleTimeString()
                };
            break;
        }
        return result;
    };
}