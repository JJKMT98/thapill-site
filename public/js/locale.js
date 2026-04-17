// thaPill locale module — currency + language detection, top-corner switcher,
// global t() and price() helpers. No page-specific wiring lives here; pages opt
// in by adding data-i18n / data-price-pence attributes (see commits that follow).
(function () {
  // ─────────────────────────────────────────────────────────────────
  // Currencies
  //   rate is GBP→target multiplier (1 GBP = N target).
  //   Static for now — Javed updates these via the admin later.
  // ─────────────────────────────────────────────────────────────────
  const CURRENCIES = {
    GBP: { code: 'GBP', symbol: '£',  rate: 1.00,    decimals: 2, position: 'pre'  },
    USD: { code: 'USD', symbol: '$',  rate: 1.27,    decimals: 2, position: 'pre'  },
    EUR: { code: 'EUR', symbol: '€',  rate: 1.17,    decimals: 2, position: 'pre'  },
    AED: { code: 'AED', symbol: 'AED ', rate: 4.66,  decimals: 2, position: 'pre'  },
    CAD: { code: 'CAD', symbol: 'C$', rate: 1.74,    decimals: 2, position: 'pre'  },
    AUD: { code: 'AUD', symbol: 'A$', rate: 1.93,    decimals: 2, position: 'pre'  },
    JPY: { code: 'JPY', symbol: '¥',  rate: 192.00,  decimals: 0, position: 'pre'  },
    CNY: { code: 'CNY', symbol: '¥',  rate: 9.20,    decimals: 2, position: 'pre'  },
    KRW: { code: 'KRW', symbol: '₩',  rate: 1750.00, decimals: 0, position: 'pre'  },
    INR: { code: 'INR', symbol: '₹',  rate: 106.00,  decimals: 0, position: 'pre'  },
    SGD: { code: 'SGD', symbol: 'S$', rate: 1.71,    decimals: 2, position: 'pre'  },
    CHF: { code: 'CHF', symbol: 'CHF ', rate: 1.10,  decimals: 2, position: 'pre'  },
    SAR: { code: 'SAR', symbol: 'SAR ', rate: 4.76,  decimals: 2, position: 'pre'  },
  };

  // Country (ISO-2) → preferred currency. Fallback: GBP.
  const COUNTRY_CURRENCY = {
    GB:'GBP', IE:'EUR',
    US:'USD', CA:'CAD', AU:'AUD', NZ:'AUD',
    AT:'EUR', BE:'EUR', BG:'EUR', HR:'EUR', CY:'EUR', CZ:'EUR', DK:'EUR', EE:'EUR',
    FI:'EUR', FR:'EUR', DE:'EUR', GR:'EUR', HU:'EUR', IT:'EUR', LV:'EUR', LT:'EUR',
    LU:'EUR', MT:'EUR', NL:'EUR', PL:'EUR', PT:'EUR', RO:'EUR', SK:'EUR', SI:'EUR',
    ES:'EUR', SE:'EUR', NO:'EUR', IS:'EUR', LI:'CHF', CH:'CHF',
    AE:'AED', SA:'SAR', QA:'AED', KW:'AED', BH:'AED', OM:'AED',
    JP:'JPY', CN:'CNY', HK:'CNY', TW:'CNY', KR:'KRW',
    IN:'INR', SG:'SGD',
  };

  // Country → preferred language (subset we ship translations for).
  // Falls back to 'en' for everything else.
  const COUNTRY_LANG = {
    FR:'fr', BE:'fr', LU:'fr', MC:'fr', CI:'fr', SN:'fr', CA:'en', // CA defaults EN; users can switch
    ES:'es', MX:'es', AR:'es', CO:'es', CL:'es', PE:'es', VE:'es',
    IT:'it', VA:'it', SM:'it',
    DE:'de', AT:'de', LI:'de', CH:'de',
    AE:'ar', SA:'ar', QA:'ar', KW:'ar', BH:'ar', OM:'ar', EG:'ar', JO:'ar', LB:'ar',
    SY:'ar', IQ:'ar', YE:'ar', PS:'ar', LY:'ar', TN:'ar', DZ:'ar', MA:'ar',
    CN:'zh', HK:'zh', TW:'zh', SG:'zh',
    KR:'ko',
  };

  // Languages we ship. Each one is a flat key→string dictionary.
  // Keys use dot notation; pages can pass any key to t().
  const STRINGS = {
    en: {
      'switcher.language': 'Language',
      'switcher.currency': 'Currency',
      'switcher.region':   'Region',
      'switcher.title':    'Site preferences',
      'switcher.done':     'Done',

      'nav.formula':       'Formula',
      'nav.pricing':       'Pricing',
      'nav.login':         'Log In',
      'nav.dashboard':     'Dashboard',
      'nav.lockIn':        'Lock In',

      'cart.title':        'Your Cart',
      'cart.empty':        'Your cart is empty',
      'cart.shopNow':      'Shop Now',
      'cart.subtotal':     'Subtotal',
      'cart.shipping':     'Shipping',
      'cart.free':         'Free',
      'cart.total':        'Total',
      'cart.checkout':     'Checkout',
      'cart.checkoutGuest':'Checkout as Guest',
      'cart.createAcct':   'Create Account & Checkout',
      'cart.continue':     'Continue shopping',
      'cart.orLogin':      'or log in',
      'cart.remove':       'Remove',
      'cart.express':      'Express Checkout',

      'price.month':       '/mo',
      'price.save':        'SAVE',

      // Landing page
      'landing.heroTag':       'Built for Traders, Coders & Creators',
      'landing.heroLine1':     'Your edge.',
      'landing.heroLine2Pre':  'But ',
      'landing.heroGlow':      'different.',
      'landing.heroSub':       'One capsule. Six ingredients. Zero BS.<br>The daily nootropic for people who build things and refuse to coast.',
      'landing.heroCta2':      "See What's Inside",
      'landing.badgeIng':      'Active Ingredients',
      'landing.badgeBlend':    'Proprietary Blends',
      'landing.badgeTrans':    'Transparent Label',
      'landing.pillTag':       'One Pill. Every Morning.',
      'landing.pillH2':        'The <em>daily ritual</em><br>for people who build things.',
      'landing.pillDesc':      "While everyone else is reaching for their third coffee, you've already moved on. Thapill is six ingredients, fully dosed, no filler — designed for people who take their routine as seriously as their work.",
      'landing.formTag':       "// What's Inside",
      'landing.formH2':        'Full transparency.<br>No hidden blends. Ever.',
      'landing.ing.caffName':  'Natural Caffeine',
      'landing.ing.caffDesc':  "The foundation. Caffeine contributes to increased alertness — paired with L-Theanine because that's how you build a proper stack.",
      'landing.ing.theaName':  'L-Theanine',
      'landing.ing.theaDesc':  'The classic pairing. An amino acid naturally found in green tea, used in nootropic formulas worldwide. This is the stack that started it all.',
      'landing.ing.lmName':    "Lion's Mane",
      'landing.ing.lmDesc':    'The long game. A functional mushroom used in traditional Eastern practices for centuries. Full 500mg dose — no extract shortcuts.',
      'landing.ing.bacName':   'Bacopa Monnieri',
      'landing.ing.bacDesc':   'The heritage ingredient. An adaptogenic herb used in Ayurvedic tradition for thousands of years. Full 300mg — not a label-dusting sprinkle.',
      'landing.ing.alphaName': 'Alpha-GPC',
      'landing.ing.alphaDesc': 'The premium choice. A choline compound naturally present in the body, widely featured in nootropic formulas for its bioavailability. 300mg of the real thing.',
      'landing.ing.rhoName':   'Rhodiola Rosea',
      'landing.ing.rhoDesc':   'The finisher. An adaptogenic root used in Scandinavian and Russian traditions for centuries. 200mg to round out a formula built for people who show up daily.',
      'landing.showTag':       '// Premium from First Touch',
      'landing.showH2':        'Not just a supplement.<br>It’s a <em>statement</em>.',
      'landing.showDesc':      "From the matte-black bottle to the custom packaging, every detail is designed to match the ambition of the people who take it. This isn't your dad's vitamin shelf — it's a daily ritual, packaged like it deserves to be.",
      'landing.stat.caps':     'Capsules',
      'landing.stat.day':      'Per Day',
      'landing.stat.ing':      'Ingredients',
      'landing.stat.fill':     'Fillers',
      'landing.priceTag':      '// Choose Your Play',
      'landing.priceH2':       'Lock in. Show up. Repeat.',
      'landing.tryLabel':      'Try It',
      'landing.tryPer':        'One-time purchase',
      'landing.tryF1':         '30 capsules (1 month)',
      'landing.tryF2':         'No commitment',
      'landing.tryF3':         'Free UK shipping',
      'landing.tryBtn':        'Buy Once',
      'landing.lockPop':       'Most Popular',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'Monthly subscription',
      'landing.lockF1':        '30 capsules every month',
      'landing.lockF2':        'Cancel anytime',
      'landing.lockF3':        'Free UK shipping',
      'landing.lockF4':        'Earn reward points',
      'landing.bulkLabel':     '3-Month Bulk',
      'landing.bulkF1':        '90 capsules (3 months)',
      'landing.bulkF2':        'One payment',
      'landing.bulkF3':        'Free UK shipping',
      'landing.bulkF4':        'Earn reward points',
      'landing.bulkBtn':       'Buy 3 Months',
      'landing.btnHover':      'Add to Cart',
      'landing.btnAdding':     'Adding...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'Get thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// From the Community',
      'landing.socialH2':      'The aura is real.',
      'landing.finalH2Pre':    'Stop thinking about it.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     "One capsule a day. That's the whole routine.<br>Join the people who stopped settling for random stacks and started taking this seriously.",
      'landing.disclaim':      'This product is a food supplement and should not be used as a substitute for a varied diet. Do not exceed the recommended daily intake. Keep out of reach of children. Consult your doctor before use if pregnant, nursing, or on medication. Not intended to diagnose, treat, cure, or prevent any disease.',
      'landing.footShip':      'Shipping',
      'landing.footReturns':   'Returns',
      'landing.footContact':   'Contact',
    },

    fr: {
      'switcher.language': 'Langue',
      'switcher.currency': 'Devise',
      'switcher.region':   'Région',
      'switcher.title':    'Préférences du site',
      'switcher.done':     'Terminé',

      'nav.formula':       'Formule',
      'nav.pricing':       'Tarifs',
      'nav.login':         'Connexion',
      'nav.dashboard':     'Tableau de bord',
      'nav.lockIn':        'Lock In',

      'cart.title':        'Votre panier',
      'cart.empty':        'Votre panier est vide',
      'cart.shopNow':      'Acheter',
      'cart.subtotal':     'Sous-total',
      'cart.shipping':     'Livraison',
      'cart.free':         'Gratuit',
      'cart.total':        'Total',
      'cart.checkout':     'Commander',
      'cart.checkoutGuest':'Commander en invité',
      'cart.createAcct':   'Créer un compte & commander',
      'cart.continue':     'Continuer mes achats',
      'cart.orLogin':      'ou se connecter',
      'cart.remove':       'Supprimer',
      'cart.express':      'Paiement express',

      'price.month':       '/mois',
      'price.save':        'ÉCONOMISEZ',

      // Landing page
      'landing.heroTag':       'Conçu pour les traders, développeurs et créateurs',
      'landing.heroLine1':     'Ton avantage.',
      'landing.heroLine2Pre':  'Mais ',
      'landing.heroGlow':      'différent.',
      'landing.heroSub':       'Une capsule. Six ingrédients. Zéro blabla.<br>Le nootropique quotidien pour celles et ceux qui construisent et refusent de lever le pied.',
      'landing.heroCta2':      'Voir la formule',
      'landing.badgeIng':      'Ingrédients actifs',
      'landing.badgeBlend':    'Mélanges propriétaires',
      'landing.badgeTrans':    'Étiquette transparente',
      'landing.pillTag':       'Une pilule. Chaque matin.',
      'landing.pillH2':        'Le <em>rituel quotidien</em><br>pour celles et ceux qui construisent.',
      'landing.pillDesc':      "Pendant que les autres en sont à leur troisième café, tu as déjà avancé. Thapill, c'est six ingrédients, pleinement dosés, sans remplissage — pour celles et ceux qui prennent leur routine aussi au sérieux que leur travail.",
      'landing.formTag':       "// Ce qu'il y a dedans",
      'landing.formH2':        'Transparence totale.<br>Aucun mélange caché. Jamais.',
      'landing.ing.caffName':  'Caféine naturelle',
      'landing.ing.caffDesc':  "La base. La caféine contribue à augmenter la vigilance — associée à la L-Théanine, parce qu'un bon stack se construit comme ça.",
      'landing.ing.theaName':  'L-Théanine',
      'landing.ing.theaDesc':  "Le duo classique. Un acide aminé présent naturellement dans le thé vert, utilisé dans les formules nootropiques partout dans le monde. C'est le stack qui a tout commencé.",
      'landing.ing.lmName':    'Crinière de lion',
      'landing.ing.lmDesc':    "Le long terme. Un champignon fonctionnel utilisé depuis des siècles dans les pratiques traditionnelles orientales. Dose complète de 500mg — pas d'extraits au rabais.",
      'landing.ing.bacName':   'Bacopa Monnieri',
      'landing.ing.bacDesc':   "L'ingrédient ancestral. Une plante adaptogène utilisée depuis des millénaires dans la tradition ayurvédique. 300mg pleins — pas juste une poudre pour l'étiquette.",
      'landing.ing.alphaName': 'Alpha-GPC',
      'landing.ing.alphaDesc': 'Le choix haut de gamme. Un composé de choline présent dans le corps, largement utilisé dans les formules nootropiques pour sa biodisponibilité. 300mg du vrai.',
      'landing.ing.rhoName':   'Rhodiole Rosea',
      'landing.ing.rhoDesc':   'La touche finale. Une racine adaptogène utilisée depuis des siècles dans les traditions scandinave et russe. 200mg pour finaliser une formule pensée pour celles et ceux qui se présentent tous les jours.',
      'landing.showTag':       '// Premium dès le premier contact',
      'landing.showH2':        'Pas un simple complément.<br>Une <em>déclaration</em>.',
      'landing.showDesc':      "Du flacon noir mat à l'emballage personnalisé, chaque détail est pensé pour être à la hauteur de l'ambition de celles et ceux qui le prennent. Ce n'est pas la trousse à vitamines de ton père — c'est un rituel quotidien, emballé comme il le mérite.",
      'landing.stat.caps':     'Capsules',
      'landing.stat.day':      'Par jour',
      'landing.stat.ing':      'Ingrédients',
      'landing.stat.fill':     'Remplissages',
      'landing.priceTag':      '// Choisis ton plan',
      'landing.priceH2':       'Lock in. Présente-toi. Recommence.',
      'landing.tryLabel':      'Essaie',
      'landing.tryPer':        'Achat unique',
      'landing.tryF1':         '30 capsules (1 mois)',
      'landing.tryF2':         'Sans engagement',
      'landing.tryF3':         'Livraison UK gratuite',
      'landing.tryBtn':        'Acheter une fois',
      'landing.lockPop':       'Le plus populaire',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'Abonnement mensuel',
      'landing.lockF1':        '30 capsules chaque mois',
      'landing.lockF2':        'Annule quand tu veux',
      'landing.lockF3':        'Livraison UK gratuite',
      'landing.lockF4':        'Gagne des points',
      'landing.bulkLabel':     'Pack 3 mois',
      'landing.bulkF1':        '90 capsules (3 mois)',
      'landing.bulkF2':        'Un seul paiement',
      'landing.bulkF3':        'Livraison UK gratuite',
      'landing.bulkF4':        'Gagne des points',
      'landing.bulkBtn':       'Acheter 3 mois',
      'landing.btnHover':      'Ajouter au panier',
      'landing.btnAdding':     'Ajout...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'Obtiens thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// De la communauté',
      'landing.socialH2':      "L'aura est réelle.",
      'landing.finalH2Pre':    "Arrête d'y réfléchir.",
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     "Une capsule par jour. C'est toute la routine.<br>Rejoins celles et ceux qui ont arrêté de se contenter de stacks au hasard et se sont mis à prendre ça au sérieux.",
      'landing.disclaim':      "Ce produit est un complément alimentaire et ne doit pas se substituer à une alimentation variée. Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des enfants. Consulte ton médecin avant usage si tu es enceinte, allaitante ou sous traitement. Ce produit n'est pas destiné à diagnostiquer, traiter, guérir ou prévenir une maladie.",
      'landing.footShip':      'Livraison',
      'landing.footReturns':   'Retours',
      'landing.footContact':   'Contact',
    },

    es: {
      'switcher.language': 'Idioma',
      'switcher.currency': 'Moneda',
      'switcher.region':   'Región',
      'switcher.title':    'Preferencias del sitio',
      'switcher.done':     'Listo',

      'nav.formula':       'Fórmula',
      'nav.pricing':       'Precios',
      'nav.login':         'Acceder',
      'nav.dashboard':     'Panel',
      'nav.lockIn':        'Lock In',

      'cart.title':        'Tu carrito',
      'cart.empty':        'Tu carrito está vacío',
      'cart.shopNow':      'Comprar',
      'cart.subtotal':     'Subtotal',
      'cart.shipping':     'Envío',
      'cart.free':         'Gratis',
      'cart.total':        'Total',
      'cart.checkout':     'Pagar',
      'cart.checkoutGuest':'Pagar como invitado',
      'cart.createAcct':   'Crear cuenta y pagar',
      'cart.continue':     'Seguir comprando',
      'cart.orLogin':      'o iniciar sesión',
      'cart.remove':       'Quitar',
      'cart.express':      'Pago exprés',

      'price.month':       '/mes',
      'price.save':        'AHORRA',

      // Landing page
      'landing.heroTag':       'Hecho para traders, programadores y creadores',
      'landing.heroLine1':     'Tu ventaja.',
      'landing.heroLine2Pre':  'Pero ',
      'landing.heroGlow':      'diferente.',
      'landing.heroSub':       'Una cápsula. Seis ingredientes. Cero palabrería.<br>El nootrópico diario para quienes construyen cosas y no se conforman.',
      'landing.heroCta2':      'Ver qué lleva dentro',
      'landing.badgeIng':      'Ingredientes activos',
      'landing.badgeBlend':    'Mezclas propietarias',
      'landing.badgeTrans':    'Etiqueta transparente',
      'landing.pillTag':       'Una pastilla. Cada mañana.',
      'landing.pillH2':        'El <em>ritual diario</em><br>para quienes construyen cosas.',
      'landing.pillDesc':      'Mientras los demás van por su tercer café, tú ya estás a otra cosa. Thapill son seis ingredientes, a dosis completa, sin relleno — diseñado para gente que se toma su rutina tan en serio como su trabajo.',
      'landing.formTag':       '// Qué lleva dentro',
      'landing.formH2':        'Transparencia total.<br>Sin mezclas ocultas. Jamás.',
      'landing.ing.caffName':  'Cafeína natural',
      'landing.ing.caffDesc':  'La base. La cafeína contribuye a aumentar el estado de alerta — combinada con L-Teanina, porque así se monta un stack en condiciones.',
      'landing.ing.theaName':  'L-Teanina',
      'landing.ing.theaDesc':  'El combo clásico. Un aminoácido natural del té verde, usado en fórmulas nootrópicas de todo el mundo. Este es el stack que empezó todo.',
      'landing.ing.lmName':    'Melena de León',
      'landing.ing.lmDesc':    'El largo plazo. Un hongo funcional usado durante siglos en prácticas tradicionales de Oriente. Dosis completa de 500mg — sin atajos de extracto.',
      'landing.ing.bacName':   'Bacopa Monnieri',
      'landing.ing.bacDesc':   'El ingrediente ancestral. Una hierba adaptógena usada en la tradición ayurveda durante miles de años. 300mg completos — no un polvito para la etiqueta.',
      'landing.ing.alphaName': 'Alfa-GPC',
      'landing.ing.alphaDesc': 'La opción premium. Un compuesto de colina presente en el cuerpo, muy usado en fórmulas nootrópicas por su biodisponibilidad. 300mg del de verdad.',
      'landing.ing.rhoName':   'Rhodiola Rosea',
      'landing.ing.rhoDesc':   'El remate. Una raíz adaptógena usada durante siglos en tradiciones escandinavas y rusas. 200mg para cerrar una fórmula pensada para quien se presenta a diario.',
      'landing.showTag':       '// Premium desde el primer contacto',
      'landing.showH2':        'No es solo un suplemento.<br>Es una <em>declaración</em>.',
      'landing.showDesc':      'Desde el bote negro mate hasta el packaging personalizado, cada detalle está diseñado para estar a la altura de la ambición de quien lo toma. Esto no es la estantería de vitaminas de tu padre — es un ritual diario, empaquetado como se merece.',
      'landing.stat.caps':     'Cápsulas',
      'landing.stat.day':      'Al día',
      'landing.stat.ing':      'Ingredientes',
      'landing.stat.fill':     'Rellenos',
      'landing.priceTag':      '// Elige tu plan',
      'landing.priceH2':       'Lock in. Aparece. Repite.',
      'landing.tryLabel':      'Pruébalo',
      'landing.tryPer':        'Compra única',
      'landing.tryF1':         '30 cápsulas (1 mes)',
      'landing.tryF2':         'Sin compromiso',
      'landing.tryF3':         'Envío gratis en UK',
      'landing.tryBtn':        'Comprar una vez',
      'landing.lockPop':       'Más popular',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'Suscripción mensual',
      'landing.lockF1':        '30 cápsulas cada mes',
      'landing.lockF2':        'Cancela cuando quieras',
      'landing.lockF3':        'Envío gratis en UK',
      'landing.lockF4':        'Acumula puntos',
      'landing.bulkLabel':     'Pack 3 meses',
      'landing.bulkF1':        '90 cápsulas (3 meses)',
      'landing.bulkF2':        'Un solo pago',
      'landing.bulkF3':        'Envío gratis en UK',
      'landing.bulkF4':        'Acumula puntos',
      'landing.bulkBtn':       'Comprar 3 meses',
      'landing.btnHover':      'Añadir al carrito',
      'landing.btnAdding':     'Añadiendo...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'Consigue thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// De la comunidad',
      'landing.socialH2':      'El aura es real.',
      'landing.finalH2Pre':    'Deja de darle vueltas.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     'Una cápsula al día. Esa es la rutina entera.<br>Únete a la gente que dejó de conformarse con stacks al azar y empezó a tomarse esto en serio.',
      'landing.disclaim':      'Este producto es un complemento alimenticio y no debe utilizarse como sustituto de una dieta variada. No superar la dosis diaria recomendada. Mantener fuera del alcance de los niños. Consulta a tu médico antes de usarlo si estás embarazada, en lactancia o tomas medicación. No está destinado a diagnosticar, tratar, curar ni prevenir ninguna enfermedad.',
      'landing.footShip':      'Envíos',
      'landing.footReturns':   'Devoluciones',
      'landing.footContact':   'Contacto',
    },

    it: {
      'switcher.language': 'Lingua',
      'switcher.currency': 'Valuta',
      'switcher.region':   'Regione',
      'switcher.title':    'Preferenze del sito',
      'switcher.done':     'Fatto',

      'nav.formula':       'Formula',
      'nav.pricing':       'Prezzi',
      'nav.login':         'Accedi',
      'nav.dashboard':     'Dashboard',
      'nav.lockIn':        'Lock In',

      'cart.title':        'Il tuo carrello',
      'cart.empty':        'Il tuo carrello è vuoto',
      'cart.shopNow':      'Acquista',
      'cart.subtotal':     'Subtotale',
      'cart.shipping':     'Spedizione',
      'cart.free':         'Gratis',
      'cart.total':        'Totale',
      'cart.checkout':     'Checkout',
      'cart.checkoutGuest':'Checkout come ospite',
      'cart.createAcct':   'Crea account & checkout',
      'cart.continue':     'Continua lo shopping',
      'cart.orLogin':      'o accedi',
      'cart.remove':       'Rimuovi',
      'cart.express':      'Checkout espresso',

      'price.month':       '/mese',
      'price.save':        'RISPARMIA',

      // Landing page
      'landing.heroTag':       'Creato per trader, programmatori e creator',
      'landing.heroLine1':     'Il tuo vantaggio.',
      'landing.heroLine2Pre':  'Ma ',
      'landing.heroGlow':      'diverso.',
      'landing.heroSub':       'Una capsula. Sei ingredienti. Zero chiacchiere.<br>Il nootropico quotidiano per chi costruisce e non si siede in panchina.',
      'landing.heroCta2':      "Guarda cosa c'è dentro",
      'landing.badgeIng':      'Ingredienti attivi',
      'landing.badgeBlend':    'Miscele proprietarie',
      'landing.badgeTrans':    'Etichetta trasparente',
      'landing.pillTag':       'Una pillola. Ogni mattina.',
      'landing.pillH2':        'Il <em>rituale quotidiano</em><br>per chi costruisce.',
      'landing.pillDesc':      'Mentre gli altri stanno al terzo caffè, tu sei già oltre. Thapill sono sei ingredienti, pienamente dosati, senza riempitivi — pensato per chi prende la propria routine sul serio quanto il lavoro.',
      'landing.formTag':       "// Cosa c'è dentro",
      'landing.formH2':        'Trasparenza totale.<br>Niente miscele nascoste. Mai.',
      'landing.ing.caffName':  'Caffeina naturale',
      'landing.ing.caffDesc':  "La base. La caffeina contribuisce ad aumentare l'attenzione — abbinata alla L-Teanina, perché così si costruisce uno stack fatto bene.",
      'landing.ing.theaName':  'L-Teanina',
      'landing.ing.theaDesc':  "L'abbinamento classico. Un amminoacido presente naturalmente nel tè verde, usato nelle formule nootropiche di tutto il mondo. È lo stack che ha iniziato tutto.",
      'landing.ing.lmName':    'Criniera di leone',
      'landing.ing.lmDesc':    'Il lungo periodo. Un fungo funzionale usato da secoli nelle pratiche tradizionali orientali. Dose piena da 500mg — nessuna scorciatoia con gli estratti.',
      'landing.ing.bacName':   'Bacopa Monnieri',
      'landing.ing.bacDesc':   "L'ingrediente ancestrale. Un'erba adattogena usata da migliaia di anni nella tradizione ayurvedica. 300mg pieni — non solo uno spolvero sull'etichetta.",
      'landing.ing.alphaName': 'Alfa-GPC',
      'landing.ing.alphaDesc': 'La scelta premium. Un composto di colina naturalmente presente nel corpo, molto usato nelle formule nootropiche per la sua biodisponibilità. 300mg del vero.',
      'landing.ing.rhoName':   'Rodiola Rosea',
      'landing.ing.rhoDesc':   'Il tocco finale. Una radice adattogena usata da secoli nelle tradizioni scandinave e russe. 200mg per completare una formula fatta per chi si presenta ogni giorno.',
      'landing.showTag':       '// Premium dal primo tocco',
      'landing.showH2':        'Non solo un integratore.<br>È una <em>dichiarazione</em>.',
      'landing.showDesc':      "Dalla bottiglia nero opaco al packaging su misura, ogni dettaglio è pensato per stare all'altezza di chi lo prende. Non è lo scaffale di vitamine di tuo padre — è un rituale quotidiano, confezionato come merita.",
      'landing.stat.caps':     'Capsule',
      'landing.stat.day':      'Al giorno',
      'landing.stat.ing':      'Ingredienti',
      'landing.stat.fill':     'Riempitivi',
      'landing.priceTag':      '// Scegli il tuo piano',
      'landing.priceH2':       'Lock in. Presentati. Ripeti.',
      'landing.tryLabel':      'Prova',
      'landing.tryPer':        'Acquisto unico',
      'landing.tryF1':         '30 capsule (1 mese)',
      'landing.tryF2':         'Nessun impegno',
      'landing.tryF3':         'Spedizione UK gratuita',
      'landing.tryBtn':        'Acquista una volta',
      'landing.lockPop':       'Il più popolare',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'Abbonamento mensile',
      'landing.lockF1':        '30 capsule ogni mese',
      'landing.lockF2':        'Annulla quando vuoi',
      'landing.lockF3':        'Spedizione UK gratuita',
      'landing.lockF4':        'Accumula punti',
      'landing.bulkLabel':     'Pacchetto 3 mesi',
      'landing.bulkF1':        '90 capsule (3 mesi)',
      'landing.bulkF2':        'Un solo pagamento',
      'landing.bulkF3':        'Spedizione UK gratuita',
      'landing.bulkF4':        'Accumula punti',
      'landing.bulkBtn':       'Acquista 3 mesi',
      'landing.btnHover':      'Aggiungi al carrello',
      'landing.btnAdding':     'Aggiungo...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'Prendi thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// Dalla community',
      'landing.socialH2':      "L'aura è reale.",
      'landing.finalH2Pre':    'Smetti di pensarci.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     "Una capsula al giorno. Questa è l'intera routine.<br>Unisciti a chi ha smesso di accontentarsi di stack casuali e ha iniziato a prenderla sul serio.",
      'landing.disclaim':      'Questo prodotto è un integratore alimentare e non deve essere usato come sostituto di una dieta variata. Non superare la dose giornaliera consigliata. Tenere fuori dalla portata dei bambini. Consulta il tuo medico prima dell\'uso se sei in gravidanza, in allattamento o in terapia. Non destinato a diagnosticare, trattare, curare o prevenire alcuna malattia.',
      'landing.footShip':      'Spedizioni',
      'landing.footReturns':   'Resi',
      'landing.footContact':   'Contatti',
    },

    de: {
      'switcher.language': 'Sprache',
      'switcher.currency': 'Währung',
      'switcher.region':   'Region',
      'switcher.title':    'Website-Einstellungen',
      'switcher.done':     'Fertig',

      'nav.formula':       'Formel',
      'nav.pricing':       'Preise',
      'nav.login':         'Anmelden',
      'nav.dashboard':     'Dashboard',
      'nav.lockIn':        'Lock In',

      'cart.title':        'Dein Warenkorb',
      'cart.empty':        'Dein Warenkorb ist leer',
      'cart.shopNow':      'Jetzt kaufen',
      'cart.subtotal':     'Zwischensumme',
      'cart.shipping':     'Versand',
      'cart.free':         'Kostenlos',
      'cart.total':        'Gesamt',
      'cart.checkout':     'Zur Kasse',
      'cart.checkoutGuest':'Als Gast bezahlen',
      'cart.createAcct':   'Konto erstellen & bezahlen',
      'cart.continue':     'Weiter einkaufen',
      'cart.orLogin':      'oder anmelden',
      'cart.remove':       'Entfernen',
      'cart.express':      'Express-Checkout',

      'price.month':       '/Monat',
      'price.save':        'SPARE',

      // Landing page
      'landing.heroTag':       'Gebaut für Trader, Entwickler und Kreative',
      'landing.heroLine1':     'Dein Vorteil.',
      'landing.heroLine2Pre':  'Aber ',
      'landing.heroGlow':      'anders.',
      'landing.heroSub':       'Eine Kapsel. Sechs Inhaltsstoffe. Null Bullshit.<br>Das tägliche Nootropikum für Menschen, die etwas bauen und nicht nachlassen.',
      'landing.heroCta2':      'Formel ansehen',
      'landing.badgeIng':      'Aktive Inhaltsstoffe',
      'landing.badgeBlend':    'Eigenmischungen',
      'landing.badgeTrans':    'Transparentes Etikett',
      'landing.pillTag':       'Eine Pille. Jeden Morgen.',
      'landing.pillH2':        'Das <em>tägliche Ritual</em><br>für Menschen, die etwas bauen.',
      'landing.pillDesc':      'Während die anderen beim dritten Kaffee hängen, bist du schon weiter. Thapill sind sechs Inhaltsstoffe, voll dosiert, ohne Füllstoffe — für Menschen, die ihre Routine genauso ernst nehmen wie ihre Arbeit.',
      'landing.formTag':       '// Was drin ist',
      'landing.formH2':        'Volle Transparenz.<br>Keine versteckten Mischungen. Nie.',
      'landing.ing.caffName':  'Natürliches Koffein',
      'landing.ing.caffDesc':  'Die Basis. Koffein trägt zu erhöhter Aufmerksamkeit bei — kombiniert mit L-Theanin, denn so baut man einen richtigen Stack.',
      'landing.ing.theaName':  'L-Theanin',
      'landing.ing.theaDesc':  'Das klassische Duo. Eine Aminosäure, die natürlich in grünem Tee vorkommt und weltweit in Nootropika-Formeln genutzt wird. Der Stack, der alles gestartet hat.',
      'landing.ing.lmName':    'Igelstachelbart',
      'landing.ing.lmDesc':    'Das Langstreckenspiel. Ein funktioneller Pilz, der seit Jahrhunderten in traditionellen östlichen Praktiken verwendet wird. Volle 500mg Dosis — keine Extrakt-Abkürzungen.',
      'landing.ing.bacName':   'Bacopa Monnieri',
      'landing.ing.bacDesc':   'Der traditionelle Inhaltsstoff. Ein adaptogenes Kraut, das seit Tausenden von Jahren in der ayurvedischen Tradition verwendet wird. Volle 300mg — kein Etiketten-Puder.',
      'landing.ing.alphaName': 'Alpha-GPC',
      'landing.ing.alphaDesc': 'Die Premium-Wahl. Eine Cholinverbindung, die natürlich im Körper vorkommt und wegen ihrer Bioverfügbarkeit oft in Nootropika-Formeln eingesetzt wird. 300mg vom Echten.',
      'landing.ing.rhoName':   'Rosenwurz',
      'landing.ing.rhoDesc':   'Der Abschluss. Eine adaptogene Wurzel, die seit Jahrhunderten in skandinavischen und russischen Traditionen verwendet wird. 200mg, um eine Formel abzurunden, die für Menschen gebaut ist, die täglich auftauchen.',
      'landing.showTag':       '// Premium ab der ersten Berührung',
      'landing.showH2':        'Nicht einfach ein Supplement.<br>Es ist ein <em>Statement</em>.',
      'landing.showDesc':      'Von der mattschwarzen Flasche bis zur individuellen Verpackung ist jedes Detail darauf ausgelegt, der Ambition derer gerecht zu werden, die es nehmen. Das ist nicht das Vitaminregal deines Vaters — es ist ein tägliches Ritual, verpackt, wie es sich gehört.',
      'landing.stat.caps':     'Kapseln',
      'landing.stat.day':      'Pro Tag',
      'landing.stat.ing':      'Inhaltsstoffe',
      'landing.stat.fill':     'Füllstoffe',
      'landing.priceTag':      '// Wähle deinen Plan',
      'landing.priceH2':       'Lock in. Auftauchen. Wiederholen.',
      'landing.tryLabel':      'Probier es',
      'landing.tryPer':        'Einmalkauf',
      'landing.tryF1':         '30 Kapseln (1 Monat)',
      'landing.tryF2':         'Keine Verpflichtung',
      'landing.tryF3':         'Kostenloser UK-Versand',
      'landing.tryBtn':        'Einmal kaufen',
      'landing.lockPop':       'Am beliebtesten',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'Monatliches Abo',
      'landing.lockF1':        '30 Kapseln jeden Monat',
      'landing.lockF2':        'Jederzeit kündbar',
      'landing.lockF3':        'Kostenloser UK-Versand',
      'landing.lockF4':        'Punkte sammeln',
      'landing.bulkLabel':     '3-Monats-Paket',
      'landing.bulkF1':        '90 Kapseln (3 Monate)',
      'landing.bulkF2':        'Eine Zahlung',
      'landing.bulkF3':        'Kostenloser UK-Versand',
      'landing.bulkF4':        'Punkte sammeln',
      'landing.bulkBtn':       '3 Monate kaufen',
      'landing.btnHover':      'In den Warenkorb',
      'landing.btnAdding':     'Hinzufügen...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'Hol dir thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// Aus der Community',
      'landing.socialH2':      'Die Aura ist real.',
      'landing.finalH2Pre':    'Hör auf, drüber nachzudenken.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     'Eine Kapsel pro Tag. Das ist die ganze Routine.<br>Schließ dich den Leuten an, die aufgehört haben, sich mit zufälligen Stacks zufriedenzugeben, und das Ganze ernst nehmen.',
      'landing.disclaim':      'Dieses Produkt ist ein Nahrungsergänzungsmittel und kein Ersatz für eine abwechslungsreiche Ernährung. Die empfohlene Tagesdosis nicht überschreiten. Außerhalb der Reichweite von Kindern aufbewahren. Konsultiere vor der Anwendung deinen Arzt, wenn du schwanger bist, stillst oder Medikamente einnimmst. Nicht dazu bestimmt, Krankheiten zu diagnostizieren, zu behandeln, zu heilen oder zu verhindern.',
      'landing.footShip':      'Versand',
      'landing.footReturns':   'Rücksendungen',
      'landing.footContact':   'Kontakt',
    },

    ar: {
      'switcher.language': 'اللغة',
      'switcher.currency': 'العملة',
      'switcher.region':   'المنطقة',
      'switcher.title':    'تفضيلات الموقع',
      'switcher.done':     'تم',

      'nav.formula':       'التركيبة',
      'nav.pricing':       'الأسعار',
      'nav.login':         'تسجيل الدخول',
      'nav.dashboard':     'لوحة التحكم',
      'nav.lockIn':        'Lock In',

      'cart.title':        'سلتك',
      'cart.empty':        'سلتك فارغة',
      'cart.shopNow':      'تسوّق الآن',
      'cart.subtotal':     'المجموع الفرعي',
      'cart.shipping':     'الشحن',
      'cart.free':         'مجاني',
      'cart.total':        'المجموع',
      'cart.checkout':     'إتمام الشراء',
      'cart.checkoutGuest':'إتمام الشراء كزائر',
      'cart.createAcct':   'أنشئ حسابًا وأكمل الشراء',
      'cart.continue':     'متابعة التسوق',
      'cart.orLogin':      'أو سجّل الدخول',
      'cart.remove':       'إزالة',
      'cart.express':      'الدفع السريع',

      'price.month':       '/شهر',
      'price.save':        'وفّر',

      // Landing page
      'landing.heroTag':       'مصنوع للمتداولين والمبرمجين والمبدعين',
      'landing.heroLine1':     'ميزتك.',
      'landing.heroLine2Pre':  'لكن ',
      'landing.heroGlow':      'مختلفة.',
      'landing.heroSub':       'كبسولة واحدة. ستة مكونات. بدون كلام فارغ.<br>المنشّط اليومي للعقل لمن يبنون ولا يتوقفون.',
      'landing.heroCta2':      'شاهد المكونات',
      'landing.badgeIng':      'مكونات فعّالة',
      'landing.badgeBlend':    'خلطات سرية',
      'landing.badgeTrans':    'ملصق شفاف',
      'landing.pillTag':       'حبّة واحدة. كل صباح.',
      'landing.pillH2':        '<em>الطقس اليومي</em><br>لمن يبنون.',
      'landing.pillDesc':      'بينما يسعى الآخرون خلف قهوتهم الثالثة، أنت تقدّمت بالفعل. ثابيل ستة مكونات بجرعات كاملة، بلا حشو — مصمَّم لمن يأخذون روتينهم بجدية بقدر عملهم.',
      'landing.formTag':       '// ما بالداخل',
      'landing.formH2':        'شفافية كاملة.<br>بلا خلطات مخفية. أبدًا.',
      'landing.ing.caffName':  'كافيين طبيعي',
      'landing.ing.caffDesc':  'الأساس. يساهم الكافيين في زيادة اليقظة — مقترنًا بال-ثيانين لأن هكذا تُبنى وصفة صحيحة.',
      'landing.ing.theaName':  'L-ثيانين',
      'landing.ing.theaDesc':  'الاقتران الكلاسيكي. حمض أميني يوجد طبيعيًا في الشاي الأخضر، يُستخدم في وصفات المنشّطات العقلية حول العالم. هو الوصفة التي بدأت كل شيء.',
      'landing.ing.lmName':    'عرف الأسد',
      'landing.ing.lmDesc':    'اللعب الطويل. فطر وظيفي مستخدم منذ قرون في الممارسات الشرقية التقليدية. جرعة كاملة 500 ملغ — بلا اختصارات.',
      'landing.ing.bacName':   'باكوبا مونييري',
      'landing.ing.bacDesc':   'المكوّن العريق. عشبة متكيّفة استُخدمت آلاف السنين في التراث الأيورفيدي. 300 ملغ كاملة — لا مجرد ذرّ للملصق.',
      'landing.ing.alphaName': 'ألفا-GPC',
      'landing.ing.alphaDesc': 'الخيار الفاخر. مركّب كولين موجود طبيعيًا في الجسم، مستخدم بكثرة في وصفات المنشّطات العقلية لتوفّره الحيوي. 300 ملغ من الحقيقي.',
      'landing.ing.rhoName':   'رهوديولا روسيا',
      'landing.ing.rhoDesc':   'اللمسة الأخيرة. جذر متكيّف استُخدم قرونًا في التقاليد الإسكندنافية والروسية. 200 ملغ لإتمام وصفة مبنية لمن يحضرون يوميًا.',
      'landing.showTag':       '// فاخر من اللمسة الأولى',
      'landing.showH2':        'ليس مجرد مكمّل.<br>إنه <em>تصريح</em>.',
      'landing.showDesc':      'من العلبة السوداء المطفأة إلى التغليف المخصَّص، كل تفصيل مصمَّم ليناسب طموح من يتناوله. هذا ليس رف فيتامينات والدك — إنه طقس يومي، مغلَّف كما يستحق.',
      'landing.stat.caps':     'كبسولة',
      'landing.stat.day':      'يوميًا',
      'landing.stat.ing':      'مكونات',
      'landing.stat.fill':     'حشو',
      'landing.priceTag':      '// اختر خطتك',
      'landing.priceH2':       'لك إن. احضر. كرّر.',
      'landing.tryLabel':      'جرّب',
      'landing.tryPer':        'شراء لمرة واحدة',
      'landing.tryF1':         '30 كبسولة (شهر واحد)',
      'landing.tryF2':         'دون التزام',
      'landing.tryF3':         'شحن مجاني في UK',
      'landing.tryBtn':        'اشترِ مرة',
      'landing.lockPop':       'الأكثر شعبية',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       'اشتراك شهري',
      'landing.lockF1':        '30 كبسولة كل شهر',
      'landing.lockF2':        'ألغِ متى شئت',
      'landing.lockF3':        'شحن مجاني في UK',
      'landing.lockF4':        'اكسب نقاط مكافآت',
      'landing.bulkLabel':     'حزمة 3 أشهر',
      'landing.bulkF1':        '90 كبسولة (3 أشهر)',
      'landing.bulkF2':        'دفعة واحدة',
      'landing.bulkF3':        'شحن مجاني في UK',
      'landing.bulkF4':        'اكسب نقاط مكافآت',
      'landing.bulkBtn':       'اشترِ 3 أشهر',
      'landing.btnHover':      'أضف إلى السلة',
      'landing.btnAdding':     'جاري الإضافة...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'احصل على thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// من المجتمع',
      'landing.socialH2':      'الأورا حقيقية.',
      'landing.finalH2Pre':    'كفى تفكيرًا.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     'كبسولة واحدة يوميًا. هذا هو الروتين كله.<br>انضم إلى من توقفوا عن القبول بوصفات عشوائية وبدأوا يأخذون الأمر بجدية.',
      'landing.disclaim':      'هذا المنتج مكمّل غذائي ولا يُستخدم بديلاً عن نظام غذائي متوازن. لا تتجاوز الجرعة اليومية الموصى بها. يُحفظ بعيدًا عن متناول الأطفال. استشر طبيبك قبل الاستخدام إذا كنتِ حاملًا أو مرضعة أو تتناول أدوية. غير مخصص لتشخيص أو علاج أو شفاء أو الوقاية من أي مرض.',
      'landing.footShip':      'الشحن',
      'landing.footReturns':   'الإرجاع',
      'landing.footContact':   'اتصل بنا',
    },

    zh: {
      'switcher.language': '语言',
      'switcher.currency': '货币',
      'switcher.region':   '地区',
      'switcher.title':    '站点偏好',
      'switcher.done':     '完成',

      'nav.formula':       '配方',
      'nav.pricing':       '价格',
      'nav.login':         '登录',
      'nav.dashboard':     '仪表板',
      'nav.lockIn':        'Lock In',

      'cart.title':        '您的购物车',
      'cart.empty':        '购物车是空的',
      'cart.shopNow':      '立即购买',
      'cart.subtotal':     '小计',
      'cart.shipping':     '配送',
      'cart.free':         '免费',
      'cart.total':        '总计',
      'cart.checkout':     '结账',
      'cart.checkoutGuest':'以访客身份结账',
      'cart.createAcct':   '创建账户并结账',
      'cart.continue':     '继续购物',
      'cart.orLogin':      '或登录',
      'cart.remove':       '移除',
      'cart.express':      '快速结账',

      'price.month':       '/月',
      'price.save':        '节省',

      // Landing page
      'landing.heroTag':       '为交易员、开发者和创作者打造',
      'landing.heroLine1':     '你的优势。',
      'landing.heroLine2Pre':  '但 ',
      'landing.heroGlow':      '不同。',
      'landing.heroSub':       '一粒胶囊。六种成分。零废话。<br>为不肯停下脚步的建设者打造的日常益智剂。',
      'landing.heroCta2':      '查看配方',
      'landing.badgeIng':      '有效成分',
      'landing.badgeBlend':    '专有配方',
      'landing.badgeTrans':    '透明标签',
      'landing.pillTag':       '一粒。每个早晨。',
      'landing.pillH2':        '为建设者打造的<br><em>日常仪式</em>。',
      'landing.pillDesc':      '当别人还在灌第三杯咖啡时，你早已继续向前。Thapill 是六种成分，足量配置，零填充剂 — 专为把日常看得和工作一样重要的人设计。',
      'landing.formTag':       '// 里面有什么',
      'landing.formH2':        '完全透明。<br>绝不隐藏配方。',
      'landing.ing.caffName':  '天然咖啡因',
      'landing.ing.caffDesc':  '基础。咖啡因有助于提高警觉度 — 与 L-茶氨酸搭配，因为这才是真正的组合。',
      'landing.ing.theaName':  'L-茶氨酸',
      'landing.ing.theaDesc':  '经典搭配。天然存在于绿茶中的氨基酸，全球益智配方都在用。这是一切的开始。',
      'landing.ing.lmName':    '猴头菇',
      'landing.ing.lmDesc':    '长线投资。一种功能性蘑菇，数百年来在东方传统中使用。足量 500mg — 没有提取物的捷径。',
      'landing.ing.bacName':   '假马齿苋',
      'landing.ing.bacDesc':   '传统成分。阿育吠陀传统中使用了数千年的适应原草药。足量 300mg — 不是标签上的敷衍撒粉。',
      'landing.ing.alphaName': 'α-GPC',
      'landing.ing.alphaDesc': '高端选择。人体内天然存在的胆碱化合物，因其生物利用度被广泛用于益智配方。300mg 真材实料。',
      'landing.ing.rhoName':   '红景天',
      'landing.ing.rhoDesc':   '收尾。北欧和俄罗斯传统中使用了几百年的适应原根。200mg 完成一个为每日出现的人打造的配方。',
      'landing.showTag':       '// 从第一眼就高端',
      'landing.showH2':        '不只是补剂。<br>这是一种<em>态度</em>。',
      'landing.showDesc':      '从哑光黑瓶到定制包装，每个细节都为匹配服用者的野心而设计。这不是你父亲的维生素架 — 这是一个日常仪式，包装得像它该得到的那样。',
      'landing.stat.caps':     '胶囊',
      'landing.stat.day':      '每日',
      'landing.stat.ing':      '成分',
      'landing.stat.fill':     '填充剂',
      'landing.priceTag':      '// 选择你的方案',
      'landing.priceH2':       '锁定。出现。重复。',
      'landing.tryLabel':      '先试试',
      'landing.tryPer':        '一次性购买',
      'landing.tryF1':         '30 粒（1 个月）',
      'landing.tryF2':         '无承诺',
      'landing.tryF3':         '英国免费配送',
      'landing.tryBtn':        '购买一次',
      'landing.lockPop':       '最受欢迎',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       '每月订阅',
      'landing.lockF1':        '每月 30 粒',
      'landing.lockF2':        '随时取消',
      'landing.lockF3':        '英国免费配送',
      'landing.lockF4':        '赚取积分',
      'landing.bulkLabel':     '3 个月装',
      'landing.bulkF1':        '90 粒（3 个月）',
      'landing.bulkF2':        '一次付款',
      'landing.bulkF3':        '英国免费配送',
      'landing.bulkF4':        '赚取积分',
      'landing.bulkBtn':       '购买 3 个月',
      'landing.btnHover':      '加入购物车',
      'landing.btnAdding':     '加入中...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    '获取 thaPill — {price}{priceMonth}',
      'landing.socialTag':     '// 来自社区',
      'landing.socialH2':      '气场是真的。',
      'landing.finalH2Pre':    '别再想了。',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     '一天一粒。这就是全部的日常。<br>加入那些不再满足于随机组合、开始认真对待的人。',
      'landing.disclaim':      '本产品为食品补充剂，不得用作均衡饮食的替代品。请勿超过推荐每日剂量。请存放在儿童够不到的地方。如果您怀孕、哺乳或正在服药，请在使用前咨询医生。本产品不用于诊断、治疗、治愈或预防任何疾病。',
      'landing.footShip':      '配送',
      'landing.footReturns':   '退货',
      'landing.footContact':   '联系',
    },

    ko: {
      'switcher.language': '언어',
      'switcher.currency': '통화',
      'switcher.region':   '지역',
      'switcher.title':    '사이트 환경설정',
      'switcher.done':     '완료',

      'nav.formula':       '성분',
      'nav.pricing':       '가격',
      'nav.login':         '로그인',
      'nav.dashboard':     '대시보드',
      'nav.lockIn':        'Lock In',

      'cart.title':        '장바구니',
      'cart.empty':        '장바구니가 비어 있습니다',
      'cart.shopNow':      '쇼핑하기',
      'cart.subtotal':     '소계',
      'cart.shipping':     '배송',
      'cart.free':         '무료',
      'cart.total':        '합계',
      'cart.checkout':     '결제하기',
      'cart.checkoutGuest':'비회원 결제',
      'cart.createAcct':   '계정 만들고 결제',
      'cart.continue':     '쇼핑 계속하기',
      'cart.orLogin':      '또는 로그인',
      'cart.remove':       '삭제',
      'cart.express':      '간편 결제',

      'price.month':       '/월',
      'price.save':        '할인',

      // Landing page
      'landing.heroTag':       '트레이더, 개발자, 크리에이터를 위해 만들어진',
      'landing.heroLine1':     '너의 엣지.',
      'landing.heroLine2Pre':  '하지만 ',
      'landing.heroGlow':      '다르게.',
      'landing.heroSub':       '한 알. 여섯 가지 성분. 허세 없음.<br>멈추지 않고 만들어내는 사람들을 위한 매일의 누트로픽.',
      'landing.heroCta2':      '성분 보기',
      'landing.badgeIng':      '활성 성분',
      'landing.badgeBlend':    '독점 블렌드',
      'landing.badgeTrans':    '투명한 라벨',
      'landing.pillTag':       '한 알. 매일 아침.',
      'landing.pillH2':        '<em>일상의 의식</em><br>만들어내는 사람들을 위한.',
      'landing.pillDesc':      '다른 사람들이 세 번째 커피를 마실 때, 너는 이미 다음 단계에 있다. Thapill은 여섯 성분을 풀 도즈로 채운 필러 제로 포뮬러 — 루틴을 일만큼 진지하게 생각하는 사람들을 위해 설계되었다.',
      'landing.formTag':       '// 안에 들어있는 것',
      'landing.formH2':        '완전한 투명성.<br>숨겨진 블렌드 없음. 절대로.',
      'landing.ing.caffName':  '천연 카페인',
      'landing.ing.caffDesc':  '기본. 카페인은 각성도 향상에 기여한다 — L-테아닌과 함께, 그것이 제대로 된 스택을 만드는 방법이다.',
      'landing.ing.theaName':  'L-테아닌',
      'landing.ing.theaDesc':  '고전적인 조합. 녹차에 자연적으로 존재하는 아미노산으로 전 세계 누트로픽 포뮬러에 사용된다. 모든 것이 시작된 스택.',
      'landing.ing.lmName':    '노루궁뎅이버섯',
      'landing.ing.lmDesc':    '장기전. 수세기 동안 동양의 전통에서 사용된 기능성 버섯. 풀 500mg 도즈 — 추출물로 얼버무리지 않는다.',
      'landing.ing.bacName':   '바코파 모니에리',
      'landing.ing.bacDesc':   '전통 성분. 아유르베다 전통에서 수천 년간 사용된 어댑토젠 허브. 풀 300mg — 라벨용 장식 가루가 아니다.',
      'landing.ing.alphaName': '알파-GPC',
      'landing.ing.alphaDesc': '프리미엄 선택. 체내에 자연적으로 존재하는 콜린 화합물로, 생체이용률 때문에 누트로픽 포뮬러에 널리 사용된다. 진짜로 300mg.',
      'landing.ing.rhoName':   '로디올라 로세아',
      'landing.ing.rhoDesc':   '마무리. 스칸디나비아와 러시아 전통에서 수세기 동안 사용된 어댑토젠 뿌리. 매일 등장하는 사람들을 위한 포뮬러를 완성하는 200mg.',
      'landing.showTag':       '// 첫 접촉부터 프리미엄',
      'landing.showH2':        '단순한 보충제가 아니다.<br><em>선언</em>이다.',
      'landing.showDesc':      '매트 블랙 보틀부터 커스텀 패키징까지, 모든 디테일은 이것을 복용하는 사람들의 야망에 맞춰 설계되었다. 이건 아빠의 비타민 선반이 아니다 — 이것은 일상의 의식이며, 그에 걸맞게 포장되었다.',
      'landing.stat.caps':     '캡슐',
      'landing.stat.day':      '하루',
      'landing.stat.ing':      '성분',
      'landing.stat.fill':     '필러',
      'landing.priceTag':      '// 플랜을 골라라',
      'landing.priceH2':       '락인. 등장. 반복.',
      'landing.tryLabel':      '시도해봐',
      'landing.tryPer':        '단건 구매',
      'landing.tryF1':         '30캡슐 (1개월)',
      'landing.tryF2':         '약정 없음',
      'landing.tryF3':         'UK 무료 배송',
      'landing.tryBtn':        '한 번 구매',
      'landing.lockPop':       '가장 인기',
      'landing.lockLabel':     'Lock In',
      'landing.lockPer':       '월 구독',
      'landing.lockF1':        '매달 30캡슐',
      'landing.lockF2':        '언제든 취소 가능',
      'landing.lockF3':        'UK 무료 배송',
      'landing.lockF4':        '포인트 적립',
      'landing.bulkLabel':     '3개월 팩',
      'landing.bulkF1':        '90캡슐 (3개월)',
      'landing.bulkF2':        '한 번 결제',
      'landing.bulkF3':        'UK 무료 배송',
      'landing.bulkF4':        '포인트 적립',
      'landing.bulkBtn':       '3개월 구매',
      'landing.btnHover':      '장바구니에 추가',
      'landing.btnAdding':     '추가 중...',
      'landing.ctaLockIn':     'Lock In — {price}{priceMonth}',
      'landing.ctaGetPill':    'thaPill 받기 — {price}{priceMonth}',
      'landing.socialTag':     '// 커뮤니티에서',
      'landing.socialH2':      '아우라는 진짜다.',
      'landing.finalH2Pre':    '더 이상 고민하지 마.',
      'landing.finalGlow':     'Lock in.',
      'landing.finalDesc':     '하루 한 알. 그게 루틴 전부다.<br>무작위 스택에 만족하는 걸 멈추고 진지하게 받아들이기 시작한 사람들에 합류해라.',
      'landing.disclaim':      '본 제품은 식이보충제이며 다양한 식단의 대체품으로 사용해서는 안 됩니다. 권장 1일 섭취량을 초과하지 마십시오. 어린이의 손이 닿지 않는 곳에 보관하십시오. 임신 중이거나 수유 중이거나 약물을 복용 중인 경우 사용 전에 의사와 상담하십시오. 어떤 질병도 진단, 치료, 치유 또는 예방하기 위한 것이 아닙니다.',
      'landing.footShip':      '배송',
      'landing.footReturns':   '반품',
      'landing.footContact':   '문의',
    },
  };

  const LANGS = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
  ];

  const RTL = new Set(['ar']);

  // ─────────────────────────────────────────────────────────────────
  // State (persisted to localStorage; can be overridden by ?lang= / ?cur=)
  // ─────────────────────────────────────────────────────────────────
  const LS_LANG = 'thapill_lang';
  const LS_CUR  = 'thapill_currency';
  const LS_AUTO = 'thapill_locale_auto'; // 1 = follow geo, 0 = user override

  let state = {
    lang: localStorage.getItem(LS_LANG) || null,
    currency: localStorage.getItem(LS_CUR) || null,
    auto: localStorage.getItem(LS_AUTO) !== '0',
    country: null,
  };

  function applyQueryOverrides() {
    const p = new URLSearchParams(window.location.search);
    const qLang = p.get('lang');
    const qCur  = p.get('cur') || p.get('currency');
    if (qLang && STRINGS[qLang]) { state.lang = qLang; state.auto = false; localStorage.setItem(LS_LANG, qLang); localStorage.setItem(LS_AUTO, '0'); }
    if (qCur && CURRENCIES[qCur.toUpperCase()]) { state.currency = qCur.toUpperCase(); state.auto = false; localStorage.setItem(LS_CUR, state.currency); localStorage.setItem(LS_AUTO, '0'); }
  }

  async function detectFromGeo() {
    if (state.lang && state.currency) return;
    try {
      const res = await fetch('/api/geo');
      if (!res.ok) return;
      const d = await res.json();
      state.country = (d && d.country) || null;
      if (state.auto && state.country) {
        if (!state.lang) state.lang = COUNTRY_LANG[state.country] || 'en';
        if (!state.currency) state.currency = COUNTRY_CURRENCY[state.country] || 'GBP';
      }
    } catch {}
    if (!state.lang) state.lang = 'en';
    if (!state.currency) state.currency = 'GBP';
  }

  // ─────────────────────────────────────────────────────────────────
  // Public helpers
  // ─────────────────────────────────────────────────────────────────
  function t(key, fallback) {
    const dict = STRINGS[state.lang] || STRINGS.en;
    return (dict && dict[key]) || (STRINGS.en[key]) || (fallback != null ? fallback : key);
  }

  function price(pence) {
    const c = CURRENCIES[state.currency] || CURRENCIES.GBP;
    const value = (pence / 100) * c.rate;
    const decs = c.decimals;
    const formatted = decs === 0 ? Math.round(value).toLocaleString() : value.toFixed(decs);
    return c.position === 'pre' ? c.symbol + formatted : formatted + c.symbol;
  }

  // Apply current language/currency to everything in the DOM that opted in.
  function applyToDOM(root) {
    root = root || document;
    document.documentElement.setAttribute('lang', state.lang);
    document.documentElement.setAttribute('dir', RTL.has(state.lang) ? 'rtl' : 'ltr');

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const txt = t(key);
      if (el.placeholder !== undefined && el.tagName === 'INPUT') el.placeholder = txt;
      else el.textContent = txt;
      // Keep glitch ::before/::after copies in sync with the translated text.
      if (el.hasAttribute('data-text')) el.setAttribute('data-text', txt);
    });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      // Format: "key:attr[,key:attr...]"
      const spec = el.getAttribute('data-i18n-attr');
      spec.split(',').forEach((pair) => {
        const [k, a] = pair.split(':').map(s => s.trim());
        if (k && a) el.setAttribute(a, t(k));
      });
    });
    root.querySelectorAll('[data-price-pence]').forEach((el) => {
      const p = Number(el.getAttribute('data-price-pence')) || 0;
      el.textContent = price(p);
    });
  }

  function setLanguage(lang) {
    if (!STRINGS[lang]) return;
    state.lang = lang;
    state.auto = false;
    localStorage.setItem(LS_LANG, lang);
    localStorage.setItem(LS_AUTO, '0');
    applyToDOM();
    document.dispatchEvent(new CustomEvent('locale:change', { detail: { ...state } }));
  }
  function setCurrency(cur) {
    cur = (cur || '').toUpperCase();
    if (!CURRENCIES[cur]) return;
    state.currency = cur;
    state.auto = false;
    localStorage.setItem(LS_CUR, cur);
    localStorage.setItem(LS_AUTO, '0');
    applyToDOM();
    document.dispatchEvent(new CustomEvent('locale:change', { detail: { ...state } }));
  }

  // ─────────────────────────────────────────────────────────────────
  // Top-corner switcher widget (floating, every page)
  // ─────────────────────────────────────────────────────────────────
  function injectSwitcher() {
    if (document.getElementById('localeSwitcher')) return;

    const style = document.createElement('style');
    style.textContent = `
      .locale-switcher { position: fixed; top: 18px; right: 100px; z-index: 9985; }
      [dir="rtl"] .locale-switcher { right: auto; left: 100px; }
      .locale-trigger {
        display: flex; align-items: center; gap: 6px;
        background: rgba(8,8,15,0.6); border: 1px solid var(--border, #151525);
        color: var(--text, #e8e8f0); font-family: 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.5px; padding: 6px 10px;
        border-radius: 999px; cursor: pointer; backdrop-filter: blur(10px);
        transition: border-color 0.2s, color 0.2s;
      }
      .locale-trigger:hover { border-color: var(--electric, #00ff88); color: var(--electric, #00ff88); }
      .locale-trigger .sep { color: var(--text-dim, #55556a); }
      .locale-panel {
        position: absolute; top: calc(100% + 8px); right: 0;
        width: 240px; background: var(--card, #0c0c18);
        border: 1px solid var(--border, #151525); border-radius: 12px;
        padding: 14px; display: none; box-shadow: 0 16px 50px rgba(0,0,0,0.5);
      }
      [dir="rtl"] .locale-panel { right: auto; left: 0; }
      .locale-switcher.open .locale-panel { display: block; }
      .locale-panel h4 { font-size: 11px; color: var(--text-dim, #55556a);
        text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;
        font-family: 'JetBrains Mono', monospace; font-weight: 600;
      }
      .locale-panel select {
        width: 100%; background: var(--surface, #08080f);
        border: 1px solid var(--border, #151525); border-radius: 8px;
        color: var(--text, #e8e8f0); padding: 8px 10px; font-size: 13px;
        font-family: 'Space Grotesk', sans-serif; outline: none; margin-bottom: 12px;
      }
      .locale-panel select:focus { border-color: var(--electric, #00ff88); }
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'locale-switcher';
    wrap.id = 'localeSwitcher';
    wrap.innerHTML = `
      <button class="locale-trigger" id="localeTrigger" aria-haspopup="true" aria-expanded="false">
        <span id="localeLangLabel">EN</span>
        <span class="sep">·</span>
        <span id="localeCurLabel">GBP</span>
        <span class="sep">▾</span>
      </button>
      <div class="locale-panel" id="localePanel">
        <h4 data-locale-label="language">Language</h4>
        <select id="localeLangSel"></select>
        <h4 data-locale-label="currency">Currency</h4>
        <select id="localeCurSel"></select>
      </div>
    `;
    document.body.appendChild(wrap);

    const trigger = document.getElementById('localeTrigger');
    const panel   = document.getElementById('localePanel');
    const langSel = document.getElementById('localeLangSel');
    const curSel  = document.getElementById('localeCurSel');

    langSel.innerHTML = LANGS.map((l) => `<option value="${l.code}">${l.name}</option>`).join('');
    curSel.innerHTML  = Object.values(CURRENCIES)
      .map((c) => `<option value="${c.code}">${c.code} (${c.symbol.trim()})</option>`).join('');

    function refreshLabels() {
      document.getElementById('localeLangLabel').textContent = state.lang.toUpperCase();
      document.getElementById('localeCurLabel').textContent  = state.currency;
      langSel.value = state.lang;
      curSel.value  = state.currency;
      wrap.querySelectorAll('[data-locale-label="language"]').forEach((el) => el.textContent = t('switcher.language'));
      wrap.querySelectorAll('[data-locale-label="currency"]').forEach((el) => el.textContent = t('switcher.currency'));
    }

    trigger.addEventListener('click', () => {
      wrap.classList.toggle('open');
      trigger.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) wrap.classList.remove('open'); });

    langSel.addEventListener('change', () => { setLanguage(langSel.value); refreshLabels(); });
    curSel.addEventListener('change', () => { setCurrency(curSel.value); refreshLabels(); });
    document.addEventListener('locale:change', refreshLabels);

    refreshLabels();
  }

  // ─────────────────────────────────────────────────────────────────
  // Bootstrap
  // ─────────────────────────────────────────────────────────────────
  applyQueryOverrides();

  async function init() {
    await detectFromGeo();
    if (!STRINGS[state.lang]) state.lang = 'en';
    if (!CURRENCIES[state.currency]) state.currency = 'GBP';
    applyToDOM();
    injectSwitcher();
    document.dispatchEvent(new CustomEvent('locale:ready', { detail: { ...state } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Locale = {
    t, price, applyToDOM, setLanguage, setCurrency,
    get lang() { return state.lang; },
    get currency() { return state.currency; },
    get country() { return state.country; },
    LANGS, CURRENCIES,
  };
})();
