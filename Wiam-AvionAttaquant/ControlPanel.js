// ControlPanel.js
// Panneau de réglages en haut de l'écran : semi-transparent, repliable comme
// un accordéon (clic sur l'en-tête). Élément DOM, donc pas un Vehicle.
// Styles : shared/ui/control-panel.css.

class ControlPanel {
  constructor(title, options = {}) {
    this.isOpen = options.open ?? true;
    this.debugCheckbox = null;

    this.root = createDiv();
    this.root.class('control-panel');

    this.header = createDiv();
    this.header.parent(this.root);
    this.header.class('control-panel__header');
    this.header.attribute('role', 'button');
    this.header.attribute('tabindex', '0');

    this.chevron = createSpan('▾');
    this.chevron.parent(this.header);
    this.chevron.class('control-panel__chevron');

    let titleSpan = createSpan(title);
    titleSpan.parent(this.header);
    titleSpan.class('control-panel__title');

    if (options.homeHref) {
      let home = createA(options.homeHref, '← Accueil');
      home.parent(this.header);
      home.class('control-panel__home');
      home.elt.addEventListener('click', (event) => event.stopPropagation());
    }

    this.body = createDiv();
    this.body.parent(this.root);
    this.body.class('control-panel__body');

    this.header.elt.addEventListener('click', () => this.toggle());
    this.header.elt.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggle();
      }
    });
    this.render();
  }

  // Ajoute un curseur avec son libellé et sa valeur affichée en direct.
  // Renvoie le p5.Element du curseur (lire avec slider.value()).
  addSlider(label, min, max, value, step, onChange = null) {
    let row = this.createRow(label);
    let slider = createSlider(min, max, value, step);
    slider.parent(row);
    slider.class('control-panel__slider');
    let output = createSpan(ControlPanel.format(value, step));
    output.parent(row);
    output.class('control-panel__value');
    slider.input(() => {
      let current = Number(slider.value());
      output.html(ControlPanel.format(current, step));
      if (onChange !== null) {
        onChange(current);
      }
    });
    return slider;
  }

  // Ajoute une case à cocher. Renvoie le p5.Element (checkbox.checked()).
  addCheckbox(label, checked = false, onChange = null) {
    let row = this.createRow('');
    let checkbox = createCheckbox(label, checked);
    checkbox.parent(row);
    checkbox.class('control-panel__checkbox');
    checkbox.changed(() => {
      if (onChange !== null) {
        onChange(checkbox.checked());
      }
    });
    return checkbox;
  }

  // Case « Debug » liée à Vehicle.debug, synchronisée avec toggleDebug().
  addDebugToggle(label = 'Debug (touche D)') {
    this.debugCheckbox = this.addCheckbox(label, Vehicle.debug, (on) => {
      this.setDebug(on);
    });
    return this.debugCheckbox;
  }

  setDebug(on) {
    Vehicle.debug = on;
    if (this.debugCheckbox !== null) {
      this.debugCheckbox.checked(on);
    }
  }

  // À appeler depuis keyPressed() pour la touche D.
  toggleDebug() {
    this.setDebug(!Vehicle.debug);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  render() {
    if (this.isOpen === true) {
      this.root.removeClass('is-closed');
    } else {
      this.root.addClass('is-closed');
    }
    this.header.attribute('aria-expanded', String(this.isOpen));
  }

  createRow(label) {
    let row = createDiv();
    row.parent(this.body);
    row.class('control-panel__row');
    if (label !== '') {
      let text = createSpan(label);
      text.parent(row);
      text.class('control-panel__label');
    }
    return row;
  }

  // Nombre de décimales déduit du pas du curseur.
  static format(value, step) {
    let decimals = 0;
    let stepText = String(step);
    if (stepText.includes('.')) {
      decimals = stepText.split('.')[1].length;
    }
    return Number(value).toFixed(decimals);
  }
}
