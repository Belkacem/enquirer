'use strict';

const colors = require('ansi-colors');
const SelectPrompt = require('./select');
const placeholder = require('../placeholder');

class FormPrompt extends SelectPrompt {
  constructor(options) {
    super({ ...options, multiple: true });
    this.type = 'form';
    this.initial = this.options.initial;
    this.align = this.options.align || 'right';
    this.emptyError = '';
    this.values = {};
  }

  async reset(first) {
    await super.reset();
    if (first === true) this._index = this.index;
    this.index = this._index;
    this.values = {};
    this.choices.forEach(choice => choice.reset && choice.reset());
    return this.render();
  }

  dispatch(ch) {
    return !!ch && this.append(ch);
  }

  append(s) {
    let ch = this.focused;
    if (!ch) return this.alert();
    let { cursor, input } = ch;
    ch.value = ch.input = input.slice(0, cursor) + s + input.slice(cursor);
    ch.cursor++;
    return this.render();
  }

  delete() {
    let ch = this.focused;
    if (!ch || ch.cursor <= 0) return this.alert();
    let { cursor, input } = ch;
    ch.value = ch.input = input.slice(0, cursor - 1) + input.slice(cursor);
    ch.cursor--;
    return this.render();
  }

  deleteForward() {
    let ch = this.focused;
    if (!ch) return this.alert();
    let { cursor, input } = ch;
    if (input[cursor] === void 0) return this.alert();
    let str = `${input}`.slice(0, cursor) + `${input}`.slice(cursor + 1);
    ch.value = ch.input = str;
    return this.render();
  }

  right() {
    let ch = this.focused;
    if (!ch) return this.alert();
    if (ch.cursor >= ch.input.length) return this.alert();
    ch.cursor++;
    return this.render();
  }

  left() {
    let ch = this.focused;
    if (!ch) return this.alert();
    if (ch.cursor <= 0) return this.alert();
    ch.cursor--;
    return this.render();
  }

  space(ch, key) {
    return this.dispatch(ch, key);
  }

  number(ch, key) {
    return this.dispatch(ch, key);
  }

  next() {
    let ch = this.focused;
    if (!ch) return this.alert();
    let { initial, input } = ch;
    if (initial && initial.startsWith(input) && input !== initial) {
      ch.value = ch.input = initial;
      ch.cursor = ch.value.length;
      return this.render();
    }
    return super.next();
  }

  prev() {
    let ch = this.focused;
    if (!ch) return this.alert();
    if (ch.cursor === 0) return super.prev();
    ch.value = ch.input = '';
    ch.cursor = 0;
    return this.render();
  }

  separator() {
    return '';
  }

  format(value) {
    return !this.state.submitted ? super.format(value) : '';
  }

  pointer() {
    return '';
  }

  indicator(choice) {
    return choice.input ? '⦿' : '⊙';
  }

  async renderChoice(choice, i) {
    await this.onChoice(choice, i);

    let { state, styles, symbols } = this;
    let { cursor, initial = '', name, hint, input = '', separator } = choice;
    let { muted, submitted, primary, danger } = styles;

    let help = hint;
    let focused = this.index === i;
    let validate = choice.validate || (() => true);
    let sep = separator || ' ' + this.styles.disabled(symbols.middot);
    let msg = choice.message;

    if (this.align === 'right') {
      msg = msg.padStart(this.longest + 1, ' ');
    }

    if (this.align === 'left') {
      msg = msg.padEnd(this.longest + 1, ' ');
    }

    // re-populate the form values (answers) object
    let value = this.values[name] = (input || initial);
    let color = input ? 'success' : 'dark';

    if ((await validate.call(choice, value, this.state)) !== true) {
      color = 'danger';
    }

    let style = styles[color];
    let indicator = style(await this.indicator(choice, i)) + (choice.pad || '');

    if (!input && initial) {
      input = !state.submitted ? muted(initial) : initial;
    }

    let indent = this.indent(choice);
    let line = () => [indent, indicator, msg + sep, input, help].filter(Boolean).join(' ');

    if (state.submitted) {
      msg = colors.unstyle(msg);
      input = submitted(input);
      help = '';
      return line();
    }

    input = placeholder(this, choice.input, initial, cursor, focused, this.styles.muted);
    if (!input) input = this.styles.muted(this.symbols.ellipsis);

    if (focused) {
      msg = primary(msg);
    }

    if (choice.error) {
      input += (input ? ' ' : '') + danger(choice.error.trim());
    } else if (choice.hint) {
      input += (input ? ' ' : '') + muted(choice.hint.trim());
    }

    return line();
  }

  async submit() {
    this.value = this.values;
    return super.base.submit.call(this);
  }
}

module.exports = FormPrompt;
