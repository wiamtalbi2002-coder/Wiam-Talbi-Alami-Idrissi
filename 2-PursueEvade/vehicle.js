class Vehicle {
  // Mode debug partagé (touche D ou case à cocher du panneau).
  static debug = false;

  constructor(x, y) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 10;
    // force maximale appliquée au véhicule
    this.maxForce = 0.25;
    // rayon du véhicule
    this.r = 16;
  }

  /*
   seek est une méthode qui permet de faire se rapprocher le véhicule de la cible passée en paramètre
   */
    seek(target) {
    // on calcule la direction vers la cible
    // C'est l'ETAPE 1 (action : se diriger vers une cible)
    let force = p5.Vector.sub(target, this.pos);

    // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
    // on limite ce vecteur à la longueur maxSpeed
    force.setMag(this.maxSpeed);
    // on calcule la force à appliquer pour atteindre la cible
    force.sub(this.vel);
    // on limite cette force à la longueur maxForce
    force.limit(this.maxForce);
    // on applique la force au véhicule
    return force;
  }

  // Fuite correcte (Reynolds) : on inverse la VITESSE DÉSIRÉE, pas la
  // force. distanceDeDetection : on ne fuit que si le danger est proche.
  flee(target, distanceDeDetection = Infinity) {
    let desiredSpeed = p5.Vector.sub(this.pos, target);
    if (desiredSpeed.mag() > distanceDeDetection) {
      return createVector(0, 0);
    }
    desiredSpeed.setMag(this.maxSpeed);
    let force = p5.Vector.sub(desiredSpeed, this.vel);
    force.limit(this.maxForce);
    return force;
  }

  // Point où sera « vehicle » dans `frames` images d'animation :
  // position + vitesse × frames.
  // Amélioration possible (proposée à la question « que faire pour
  // l'améliorer ? ») : rendre la prédiction proportionnelle à la distance,
  // comme le dit Reynolds (T = distance / vitesse max) : de loin on vise
  // loin devant, de près on vise presque la cible elle-même.
  predictPosition(vehicle, frames, proportional = false) {
    let t = frames;
    if (proportional === true) {
      t = constrain(this.pos.dist(vehicle.pos) / max(this.maxSpeed, 0.001), 0, frames);
    }
    let ahead = vehicle.vel.copy().mult(t);
    ahead.add(vehicle.pos);
    return ahead;
  }

  /* Poursuite d'un point devant la target !
     cette methode renvoie la force à appliquer au véhicule
     frames : durée de la prédiction (réglée par un curseur, 2 à 30)
  */
  pursue(target, frames = 10, proportional = false) {
    // 1 à 3 - position future de la cible (vitesse × frames + position)
    let targetAhead = this.predictPosition(target, frames, proportional);

    // 4 - dessin du point devant la target (petit cercle vert) et du
    // vecteur vitesse de la cible en mode debug
    if (Vehicle.debug) {
      this.drawVector(target.pos, target.vel.copy().mult(10));
    }
    push();
    fill('lime');
    noStroke();
    circle(targetAhead.x, targetAhead.y, 12);
    pop();

    // 5 - seek vers ce point
    return this.seek(targetAhead);
  }

  /* inverse de pursue : comme pour flee, on inverse la vitesse désirée
     (on fuit le point où sera le poursuiveur), pas la force renvoyée.
  */
  evade(pursuer, frames = 10, proportional = false) {
    let pursuerAhead = this.predictPosition(pursuer, frames, proportional);
    if (Vehicle.debug) {
      push();
      noFill();
      stroke('orange');
      circle(pursuerAhead.x, pursuerAhead.y, 14);
      pop();
    }
    return this.flee(pursuerAhead);
  }

  /**  Fonction de poursuite parfaite (avec le point devant la
  target qui se rapproche quand le poursuiveur se rapproche)
  */
  pursuePerfect(vehicle) {
    // Use the Law of Sines (https://en.wikipedia.org/wiki/Law_of_sines)
    // to predict the right collision point
    const speed_ratio = vehicle.vel.mag() / this.maxSpeed;
    const target_angle = vehicle.vel.angleBetween(p5.Vector.sub(this.pos, vehicle.pos));
    const my_angle = asin(sin(target_angle) * speed_ratio);
    const dist = this.pos.dist(vehicle.pos);
    const prediction = dist * sin(my_angle) / sin(PI - my_angle - target_angle);
    // Pas de solution (cible plus rapide que nous) : on vise la cible.
    if (!isFinite(prediction) || prediction < 0) {
      return this.seek(vehicle.pos);
    }
    const target = vehicle.vel.copy().setMag(prediction).add(vehicle.pos);
    
    drawArrow(vehicle.pos, p5.Vector.mult(vehicle.vel, 20), 'red');
    drawArrow(this.pos, p5.Vector.sub(target, this.pos), 'green');
    
    fill(0, 255, 0);
    circle(target.x, target.y, 8);
    return this.seek(target);
  }


  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  // en fait on additionne le vecteurr force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    // on ajoute l'accélération à la vitesse. L'accélération est un incrément de vitesse
    // (accélératiion = dérivée de la vitesse)
    this.vel.add(this.acc);
    // on contraint la vitesse à la valeur maxSpeed
    this.vel.limit(this.maxSpeed);
    // on ajoute la vitesse à la position. La vitesse est un incrément de position, 
    // (la vitesse est la dérivée de la position)
    this.pos.add(this.vel);

    // on remet l'accélération à zéro
    this.acc.set(0, 0);
  }

  // On dessine le véhicule
  show() {
    // formes fil de fer en blanc
    stroke(255);
    // épaisseur du trait = 2
    strokeWeight(2);

    // formes pleines en blanc
    fill(255);

    // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
    // position et rotation du repère de référence)
    push();
    // on déplace le repère de référence.
    translate(this.pos.x, this.pos.y);
    // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
    rotate(this.vel.heading());

    // Dessin d'un véhicule sous la forme d'un triangle. Comme s'il était droit, avec le 0, 0 en haut à gauche
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    // Que fait cette ligne ?
    //this.edges();

    // draw velocity vector (en mode debug)
    pop();
    if (Vehicle.debug) {
      this.drawVector(this.pos, this.vel.copy().mult(10));
    }
  }

  drawVector(pos, v) {
    push();
    // Dessin du vecteur depuis pos comme origne
    strokeWeight(3);
    stroke("red");
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    // dessine une petite fleche au bout du vecteur vitesse
    let arrowSize = 5;
    translate(pos.x + v.x , pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  // que fait cette méthode ?
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

// draw an arrow for a vector at a given base position
function drawArrow(base, vec, myColor) {
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}