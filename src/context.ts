import type { LangError } from './error'

export class Context {
  private _errors: LangError[] = []

  get errors() {
    return this._errors
  }

  addError(error: LangError) {
    this._errors.push(error)
  }

  reset() {
    this._errors = []
  }
}
