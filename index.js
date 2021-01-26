export default class GlobalModel{
    constructor(
        parrentPropertyKey,
        key = "property",
        initialState,
        structure
    ){
        // console.log(
        //     "INIT",
        //     parrentPropertyKey,
        //     key,
        //     initialState,
        //     structure
        // )
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
            push: {
                type: `PUSH`,
                exec: (propertyKey, value)=>{
                    return {
                        type: `PUSH`,
                        propertyKey,
                        value
                    }
                }
            },
            drop: {
                type: `DROP`,
                exec: (propertyKey, callbackForChild)=>{
                    return {
                        type: `DROP`,
                        propertyKey,
                        callbackForChild
                    }
                }
            },
        }
        
        // Структура
        this._structure = structure;

        // Значение
        this._value = this._initialState;

        if(typeof this._initialState === "object" && this._initialState !== null && this._initialState === this._initialState){
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
                        if(this._structure[key] instanceof GlobalModel){
                            this[key] = this._structure[key];
        
                        /*
                            Если дочернее свойство - экземпляр массива, 
                            то не передаем в него в качестве изначального
                            значения его структуру
                        */
                        }else if(this._structure[key] instanceof Array){
                            this[key] = new GlobalModel(
                                this._propertyKey,
                                key,
                                this._initialState[key] || [],
                                this._structure[key]
                            );

                        }else{
                            this[key] = new GlobalModel(
                                this._propertyKey,
                                key,
                                // this._structure[key] - дефолтное значение
                                (this._initialState[key] === undefined) ?
                                     this._structure[key] : this._initialState[key],
                                this._structure[key]
                            );
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
        
                    case state._actions.push.type:
                        newValue = [...Object.keys(state._value).reduce(
                            (a, k) => [...a, state._value[k]] , []
                        ), action.value];
                    break;
        
                    case state._actions.drop.type:
                        if(action.callbackForChild){
                            newValue = Object.keys(state._value).reduce(
                                (a, k) => [...a, state._value[k]] , []
                            ).filter(callbackForChild);

                        }else{
                            newValue = "♱death_certificate♱";
                        }
                    break;
        
                    case state._actions.toggle.type:
                        newValue = !state._value;
                    break;
                }
            }
        }

        if(typeof newState._value === "object"
            && newState._value !== null
            && newState._value === newState._value
        ){
            if(newValue !== undefined){
                // Если новое значение модели - свидетельство о смерти, то соответственно прощаемся с ней
                if(newValue === "♱death_certificate♱"){
                    return null;

                } else if(typeof newValue === "object" && newValue === newValue && newValue != null){
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
                        if(newState[key] && newState[key].reducer){
                            newState[key] = newState[key].reducer(newState[key], action);
                        }
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
                            if(newState[key] && newState[key].reducer){
                                newState[key] = newState[key].reducer(newState[key], action);
                            }
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
                            if(newState[key] && newState[key].reducer){
                                newState[key] = newState[key].reducer(newState[key], action);
                            }
                        });
    
                        return Object.assign(
                            newState,
                            {
                                _value:  Object.keys(newState._initialState).reduce(
                                    (result, key) => {
                                        if(newState[key] && newState[key]._value){
                                            return [...result, newState[key]._value];

                                        }else{
                                            return result;
                                        }
                                    }, []
                                )
                            }
                        );
                    }
                }
            }

        }else{
            if(newValue !== undefined){
                return Object.assign(
                    newState,
                    {
                        _value: newValue
                    }
                );
            }
        }

        return Object.assign({}, newState);
    };
}