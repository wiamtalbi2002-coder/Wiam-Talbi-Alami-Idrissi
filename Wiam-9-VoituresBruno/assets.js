// assets.js — reconstruit par Wiam (le fichier d'origine n'est pas dans le dépôt :
// le .gitignore de Bruno exclut "assets*"). Asset enveloppe simplement un objet.
class Asset {
  constructor(obj) {
    Object.assign(this, obj);
  }
}

// Correctif : avec TensorFlow.js 1.1.0, dispose() plante sur un modèle
// Sequential qui n'a jamais été construit (erreur « reading 'optimizer' »),
// ce qui bloquait « Préparer une nouvelle session ».
if (window.tf && tf.Sequential) {
  const disposeOrigine = tf.Sequential.prototype.dispose;
  tf.Sequential.prototype.dispose = function () {
    try {
      return disposeOrigine.call(this);
    } catch (e) {
      return null;
    }
  };
}

// Fonctions de sauvegarde appelées par sketch.js et test.js mais absentes
// du dépôt. Elles rangent un instantané dans les archives (bouton
// « Exporter les archives » pour les télécharger).
function saveGeneration(name, keys) {
  try {
    Archives.add(name, currentGen.toJSON(keys));
  } catch (e) {
    console.warn('saveGeneration', e);
  }
}

function saveTrack(name) {
  try {
    Archives.add(name, currentTrack.toJSON());
  } catch (e) {
    console.warn('saveTrack', e);
  }
}

function saveKillers(name) {
  try {
    Archives.add(name, { killers: Track.killers.map((t) => t.toJSON()) });
  } catch (e) {
    console.warn('saveKillers', e);
  }
}
