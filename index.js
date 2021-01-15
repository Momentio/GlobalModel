export default class GlobalModel{
    constructor(
        parrentPropertyKey,
        key = "property",
        initialState,
        structure
    ){
        // console.log("INIT", parrentPropertyKey,
        // key,
        // initialState,
        // structure)
        // Уникальный ключ
        this._propertyKey = parrentPropertyKey ? `${parrentPropertyKey}/${key}` : key;
        
        // Изначальное состояние
        this._initialState = initialState;
        
        // Методы управления
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
        
        // Структура
        this._structure = structure;

        // Значение
        this._value = this._initialState;

        if(typeof this._initialState === "object"){
            if(this._initialState.constructor == Object){
                // Если отсутствует чёткая структура, то берём за основу this._initialState
                if(!this._structure){
                    for(let key in this._initialState){
                        if(!(this._initialState[key] instanceof GlobalModel)){
                            this[key] = new GlobalModel(
                                this._propertyKey,
                                key,
                                this._initialState[key]
                            );
        
                        }else{
                            this[key] = this._initialState[key];
                        }
                    }

                }else{
                    for(let key in this._structure){
                        // В структуре не может быть экзмпляра GlobalModel - проверки не будет
                        if(!(this._structure[key] instanceof GlobalModel)){
                            this[key] = new GlobalModel(
                                this._propertyKey,
                                key,
                                // this._structure[key] - дефолтное значение
                                (this._initialState[key] === undefined) ?
                                     this._structure[key] : this._initialState[key],
                                this._structure[key]
                            );
        
                        }else{
                            this[key] = this._structure[key];
                        }
                    }
                }

            }else if(this._initialState.constructor == Array){
                for(let key in this._initialState){
                    if(!(this._initialState[key] instanceof GlobalModel)){
                        this[key] = new GlobalModel(
                            this._propertyKey,
                            key,
                            this._initialState[key],
                            this._structure ? this._structure[0] : undefined
                        );
    
                    }else{
                        this[key] = this._initialState[key];
                    }
                }
            }
        }
    }

    // Возвращает общее состояние модели
    reducer = (state = this, action) => {
        let newState = Object.assign({}, state);
        let newValue;

        if(action){
            if(state._propertyKey === action.propertyKey){
                switch(action.type){
                    case state._actions.reset.type:
                        newValue = state._initialState;
                    break;
        
                    case state._actions.update.type:
                        newValue = action.value;
                    break;
        
                    case state._actions.toggle.type:
                        newValue = !state._value;
                    break;
                }
            }
        }
        
        switch(typeof newState._value){
            case "object":
                if(newValue !== undefined){
                    if(typeof newValue === "object"){
                        return new GlobalModel(
                            false,
                            newState._propertyKey,
                            newValue,
                            newState._structure,
                        ).reducer();
                    }

                }else{
                    if(!newState._structure){
                        Object.keys(newState._initialState).forEach(key => {
                            newState[key] = newState[key].reducer(newState[key], action);
                        });
    
                        return Object.assign(
                            newState,
                            {
                                _value:  Object.keys(newState._initialState).reduce(
                                    (result, key) => {
                                        return Object.assign(
                                            result,
                                            {
                                                [key]: newState[key]._value
                                            }
                                        );
                                    }, {}
                                )
                            }
                        );

                    }else{
                        if(this._initialState.constructor == Object){
                            Object.keys(newState._structure).forEach(key => {
                                newState[key] = newState[key].reducer(newState[key], action);
                            });
        
                            return Object.assign(
                                newState,
                                {
                                    _value:  Object.keys(newState._structure).reduce(
                                        (result, key) => {
                                            return Object.assign(
                                                result,
                                                {
                                                    [key]: newState[key]._value
                                                }
                                            );
                                        }, {}
                                    )
                                }
                            );
        
                        }else if(this._initialState.constructor == Array){
                            Object.keys(newState._initialState).forEach(key => {
                                newState[key] = newState[key].reducer(newState[key], action);
                            });
        
                            return Object.assign(
                                newState,
                                {
                                    _value:  Object.keys(newState._initialState).reduce(
                                        (result, key) => {
                                            return Object.assign(
                                                result,
                                                {
                                                    [key]: newState[key]._value
                                                }
                                            );
                                        }, {}
                                    )
                                }
                            );
                        }
                    }
                }
            break;

            default:
                if(newValue !== undefined){
                    return Object.assign(
                        newState,
                        {
                            _value: newValue
                        }
                    );
                }
            break;
        }

        return Object.assign({}, newState);
    };
}