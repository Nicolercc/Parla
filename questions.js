window.PARLA_LESSONS = [
  {
    id: 'basics-1',
    unit: 'Unit 1',
    title: 'Essential words',
    subtitle: 'Colors, greetings, and everyday nouns',
    xp: 15,
    questions: [
      { id: 1, type: 'choice', prompt: 'apple', instruction: 'How do you say this in Spanish?', options: ['manzana', 'naranja', 'uva', 'pera'], correctIndex: 0, explain: 'Manzana means apple.' },
      { id: 2, type: 'choice', prompt: 'Good morning', instruction: 'Translate this phrase.', options: ['Buenas noches', 'Buenos días', 'Hasta luego', 'Hola a todos'], correctIndex: 1, explain: 'Buenos días is used for good morning.' },
      { id: 3, type: 'choice', prompt: 'dog', instruction: 'Pick the Spanish word.', options: ['gato', 'pez', 'perro', 'pájaro'], correctIndex: 2, explain: 'Perro means dog.' },
      { id: 4, type: 'choice', prompt: 'water', instruction: 'How do you say this in Spanish?', options: ['leche', 'vino', 'jugo', 'agua'], correctIndex: 3, explain: 'Agua means water.' },
      { id: 5, type: 'choice', prompt: 'Thank you', instruction: 'Translate this phrase.', options: ['Gracias', 'Por favor', 'De nada', 'Perdón'], correctIndex: 0, explain: 'Gracias means thank you.' },
      { id: 6, type: 'choice', prompt: 'red', instruction: 'Pick the Spanish word.', options: ['verde', 'rojo', 'azul', 'amarillo'], correctIndex: 1, explain: 'Rojo means red.' },
      { id: 7, type: 'choice', prompt: 'I eat bread', instruction: 'Translate this sentence.', options: ['Yo bebo pan', 'Tú comes pan', 'Yo como pan', 'Yo como leche'], correctIndex: 2, explain: 'Yo como pan means I eat bread.' },
      { id: 8, type: 'choice', prompt: 'house', instruction: 'How do you say this in Spanish?', options: ['coche', 'calle', 'cama', 'casa'], correctIndex: 3, explain: 'Casa means house.' },
      { id: 9, type: 'choice', prompt: 'How are you?', instruction: 'Choose the best translation.', options: ['¿Cómo estás?', '¿Qué hora es?', '¿Dónde está?', '¿Cuántos años?'], correctIndex: 0, explain: '¿Cómo estás? means how are you?' },
      { id: 10, type: 'choice', prompt: 'friend', instruction: 'Pick the Spanish word.', options: ['hermano', 'amigo', 'vecino', 'maestro'], correctIndex: 1, explain: 'Amigo means friend.' },
    ],
  },
];

window.PARLA_QUESTIONS = window.PARLA_LESSONS[0].questions;
