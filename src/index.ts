import {createStore, Store} from 'redux';

type TenxFormState = {
  submitted?: {[key: string]: string},
  current: {[key: string]: string},
}

class TenxForm extends HTMLElement {
  private state: Store<TenxFormState> = createStore((state = {current: {}}, action) => {
    switch (action.type) {
      case 'UPDATE':
        return {
          submitted: action.value,
          current: {
            ...state.current,
            [action.id]: action.value
          }
        };
      case 'SUBMIT':
        return {
          ...state,
          submitted: state.current
        }
    }

    return state;
  }, (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__());

  get formState() {
    return this.state.getState();
  }

  constructor() {
    super();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((me) => {
        me.addedNodes.forEach((node) => {
          if (node instanceof HTMLInputElement) {
            switch(node.type) {
              case "submit": {
                node.addEventListener("click", (e) => {
                  e.preventDefault();
                  this.state.dispatch({type: 'SUBMIT', value: this.state.getState().current});
                })
                break;
              }
              default: {
                node.addEventListener("blur", () => {
                  this.state.dispatch({type: 'UPDATE', id: node.id, value: node.value});
                });
              }
            }
          }
          if (node instanceof HTMLTextAreaElement) {
            node.addEventListener("blur", () => {
              this.state.dispatch({type: 'UPDATE', id: node.id, value: node.value});
            });
          }
        });
      })
    });
    observer.observe(this, {childList: true});
  }
}

customElements.define('tenx-form', TenxForm);
