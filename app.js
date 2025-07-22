// Cargar preguntas y configuración
let triviaData = [];
let config = { defaultDifficulty: 'all', defaultAmount: 25 };

async function loadData() {
  try {
    const [cfgResp, questionsResp] = await Promise.all([
      fetch('config.json').then(r => r.ok ? r.json() : {}),
      fetch('questions.json').then(r => r.json())
    ]);
    config = { ...config, ...cfgResp };
    triviaData = questionsResp;
    applyConfig();
  } catch (e) {
    console.error('Error cargando archivos', e);
  }
}

// Elementos del DOM
const startScreen = document.getElementById('start-screen');
const questionScreen = document.getElementById('question-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const questionCounter = document.getElementById('question-counter');
const scoreDisplay = document.getElementById('score');
const progressBar = document.getElementById('progress-bar');
const finalScore = document.getElementById('final-score');
const finalMessage = document.getElementById('final-message');
const errorMessage = document.getElementById('error-message');

// Elementos del Modal
const explanationModal = document.getElementById('explanation-modal');
const explanationText = document.getElementById('explanation-text');
const modalNextBtn = document.getElementById('modal-next-btn');

// Elementos de selección
const difficultySelector = document.getElementById('difficulty-selector');
const amountSelector = document.getElementById('amount-selector');

// Variables de estado del juego
let currentQuestionIndex = 0;
let score = 0;
let shuffledQuestions = [];
let selectedDifficulty = 'all';
let selectedAmount = 25;

// Event Listeners
difficultySelector.addEventListener('click', (e) => handleSelector(e, 'difficulty'));
amountSelector.addEventListener('click', (e) => handleSelector(e, 'amount'));
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});
modalNextBtn.addEventListener('click', handleNextQuestion);

function handleSelector(e, type) {
  if (e.target.tagName !== 'BUTTON') return;

  const selector = type === 'difficulty' ? difficultySelector : amountSelector;

  Array.from(selector.children).forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');

  if (type === 'difficulty') {
    selectedDifficulty = e.target.dataset.difficulty;
  } else {
    const amount = e.target.dataset.amount;
    selectedAmount = amount === 'all' ? 'all' : parseInt(amount);
  }
}

function applyConfig() {
  selectedDifficulty = config.defaultDifficulty;
  selectedAmount = config.defaultAmount;

  Array.from(difficultySelector.children).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty == selectedDifficulty);
  });
  Array.from(amountSelector.children).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.amount == String(selectedAmount));
  });
}

function startGame() {
  errorMessage.classList.add('hidden');
  let questionsToPlay = triviaData;

  if (selectedDifficulty !== 'all') {
    questionsToPlay = questionsToPlay.filter(q => q.difficulty == selectedDifficulty);
  }

  if (questionsToPlay.length === 0) {
    errorMessage.innerText = `No hay preguntas para la dificultad seleccionada. Por favor, elige otra.`;
    errorMessage.classList.remove('hidden');
    return;
  }

  shuffledQuestions = questionsToPlay.sort(() => Math.random() - 0.5);

  if (selectedAmount !== 'all' && shuffledQuestions.length > selectedAmount) {
    shuffledQuestions = shuffledQuestions.slice(0, selectedAmount);
  }

  currentQuestionIndex = 0;
  score = 0;

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  questionScreen.classList.remove('hidden');

  showQuestion();
}

function showQuestion() {
  resetState();
  const question = shuffledQuestions[currentQuestionIndex];

  const questionCard = document.querySelector('.bg-slate-50');
  questionCard.classList.remove('card-enter');
  void questionCard.offsetWidth;
  questionCard.classList.add('card-enter');

  questionText.innerText = question.question;
  questionCounter.innerText = `Pregunta ${currentQuestionIndex + 1} de ${shuffledQuestions.length}`;
  scoreDisplay.innerText = `Puntuación: ${score}`;
  progressBar.style.width = `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%`;

  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerHTML = option;
    button.classList.add('option-btn', 'w-full', 'p-4', 'border-2', 'border-slate-300', 'rounded-lg', 'text-left', 'hover:bg-slate-100', 'hover:border-blue-500');
    button.dataset.index = index;
    button.addEventListener('click', selectAnswer);
    optionsContainer.appendChild(button);
  });
}

function resetState() {
  while (optionsContainer.firstChild) {
    optionsContainer.removeChild(optionsContainer.firstChild);
  }
}

function selectAnswer(e) {
  const selectedButton = e.target.closest('button');
  const selectedIndex = parseInt(selectedButton.dataset.index);
  const question = shuffledQuestions[currentQuestionIndex];
  const correctIndex = question.answer;

  Array.from(optionsContainer.children).forEach(button => {
    button.disabled = true;
  });

  if (selectedIndex === correctIndex) {
    selectedButton.classList.add('correct');
    score++;
    scoreDisplay.innerText = `Puntuación: ${score}`;
  } else {
    selectedButton.classList.add('incorrect');
    const correctButton = optionsContainer.querySelector(`[data-index='${correctIndex}']`);
    if (correctButton) {
      correctButton.classList.add('correct');
    }
  }

  explanationText.innerText = question.ampliacion;
  if (currentQuestionIndex === shuffledQuestions.length - 1) {
    modalNextBtn.innerText = "Ver Resultados Finales";
  } else {
    modalNextBtn.innerText = "Siguiente Pregunta";
  }
  setTimeout(() => {
    explanationModal.classList.remove('hidden');
  }, 800);
}

function handleNextQuestion() {
  explanationModal.classList.add('hidden');
  currentQuestionIndex++;
  if (currentQuestionIndex < shuffledQuestions.length) {
    showQuestion();
  } else {
    showEndScreen();
  }
}

function showEndScreen() {
  questionScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');

  const totalQuestions = shuffledQuestions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  finalScore.innerText = `${score} / ${totalQuestions}`;

  let message = '';
  if (percentage === 100) {
    message = '¡Récord del mundo! Eres una leyenda del running.';
  } else if (percentage >= 80) {
    message = '¡Nivel Eliud Kipchoge! Estás en la élite.';
  } else if (percentage >= 60) {
    message = '¡Gran maratoniano! Conoces el terreno a la perfección.';
  } else if (percentage >= 40) {
    message = '¡Buen ritmo! Eres un runner experimentado.';
  } else if (percentage >= 20) {
    message = '¡Has empezado a trotar! Sigue entrenando esos conocimientos.';
  } else {
    message = 'Te estás atando las zapatillas. ¡Cada carrera empieza con un primer paso!';
  }
  finalMessage.innerText = message;
}

loadData();
