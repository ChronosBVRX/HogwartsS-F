const questions = [
    {
        question: "¿Qué cualidad valoras más en un aliado?",
        options: [
            { text: "La valentía inquebrantable", house: "Gryffindor" },
            { text: "La astucia y el ingenio", house: "Slytherin" },
            { text: "La lealtad y el trabajo duro", house: "Hufflepuff" },
            { text: "La sabiduría y el conocimiento", house: "Ravenclaw" }
        ]
    },
    {
        question: "Te encuentras con un lago oscuro. ¿Qué haces?",
        options: [
            { text: "Nadas hasta el fondo sin dudarlo", house: "Gryffindor" },
            { text: "Buscas una forma de controlarlo", house: "Slytherin" },
            { text: "Esperas a tus amigos para decidir", house: "Hufflepuff" },
            { text: "Observas sus patrones antes de actuar", house: "Ravenclaw" }
        ]
    },
    {
        question: "¿Qué poción elegirías beber?",
        options: [
            { text: "Esencia de Fuego (Poder)", house: "Gryffindor" },
            { text: "Elixir de Sombras (Invisibilidad)", house: "Slytherin" },
            { text: "Suero de la Verdad (Justicia)", house: "Hufflepuff" },
            { text: "Filtro de Claridad (Clarividencia)", house: "Ravenclaw" }
        ]
    }
];

const houseInfo = {
    "Gryffindor": {
        desc: "Donde habitan los valientes de corazón. Su osadía, temple y caballerosidad ponen aparte a los de Gryffindor.",
        color: "#740001"
    },
    "Slytherin": {
        desc: "Gente astuta que utiliza cualquier medio para lograr sus fines. Ambición y determinación son sus sellos.",
        color: "#1a472a"
    },
    "Hufflepuff": {
        desc: "Donde son justos y leales. Esos pacientes Hufflepuffs son verdaderos y no temen al trabajo pesado.",
        color: "#ecb939"
    },
    "Ravenclaw": {
        desc: "Una mente dispuesta siempre aprenderá. Donde los de inteligencia y erudición siempre encontrarán a sus semejantes.",
        color: "#0e1a40"
    }
};

let currentQuestionIndex = 0;
let scores = { Gryffindor: 0, Slytherin: 0, Hufflepuff: 0, Ravenclaw: 0 };

function startExperience() {
    fadeOut('intro-scene', () => {
        document.getElementById('intro-scene').style.display = 'none';
        document.getElementById('quiz-scene').style.display = 'block';
        showQuestion();
    });
}

function showQuestion() {
    const q = questions[currentQuestionIndex];
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');

    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.text;
        btn.onclick = () => selectOption(opt.house);
        optionsContainer.appendChild(btn);
    });

    fadeIn('quiz-scene');
}

function selectOption(house) {
    scores[house]++;
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        fadeOut('quiz-scene', showQuestion);
    } else {
        fadeOut('quiz-scene', showResult);
    }
}

function showResult() {
    const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const info = houseInfo[winner];

    document.getElementById('quiz-scene').style.display = 'none';
    document.getElementById('result-scene').style.display = 'block';
    
    document.getElementById('house-name').textContent = winner;
    document.getElementById('house-description').textContent = info.desc;
    document.getElementById('house-image').src = `assets/${winner.toLowerCase()}.png`;

    // Change background glow
    document.documentElement.style.setProperty('--primary-gold', info.color);
    
    fadeIn('result-scene');
}

// Helpers
function fadeOut(id, callback) {
    const el = document.getElementById(id);
    el.style.opacity = '1';
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = '0';
    setTimeout(callback, 500);
}

function fadeIn(id) {
    const el = document.getElementById(id);
    el.style.opacity = '0';
    el.style.display = 'block';
    setTimeout(() => {
        el.style.transition = 'opacity 0.5s ease';
        el.style.opacity = '1';
    }, 10);
}

// Simple Particles
function createParticles() {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 5 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 100}vh`;
        p.style.animation = `float ${Math.random() * 10 + 5}s linear infinite`;
        container.appendChild(p);
    }
}

// CSS Animation for particles
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        50% { opacity: 0.5; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }
`;
document.head.appendChild(style);

createParticles();
