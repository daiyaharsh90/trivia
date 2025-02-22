class TriviaGame {
    constructor() {
        this.playerName = '';
        this.score = 0;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.timer = null;
        this.timeLeft = 60;
        this.correctAnswers = 0;
        
        // DOM Elements
        this.screens = {
            welcome: document.getElementById('welcome-screen'),
            game: document.getElementById('game-screen'),
            result: document.getElementById('result-screen')
        };
        
        this.elements = {
            playerNameInput: document.getElementById('player-name'),
            categorySelect: document.getElementById('category-select'),
            timerInput: document.getElementById('timer-input'),
            startButton: document.getElementById('start-game'),
            playerNameDisplay: document.getElementById('player-name-display'),
            scoreDisplay: document.getElementById('score-display'),
            timerDisplay: document.getElementById('timer'),
            questionText: document.getElementById('question-text'),
            answersContainer: document.getElementById('answers'),
            progressFill: document.getElementById('progress-fill'),
            finalScore: document.getElementById('final-score'),
            correctAnswersDisplay: document.getElementById('correct-answers'),
            playAgainButton: document.getElementById('play-again'),
            scoresList: document.getElementById('scores-list')
        };

        this.initializeEventListeners();
        this.loadCategories();
        this.loadHighScores();
    }

    async loadCategories() {
        try {
            const response = await fetch('https://opentdb.com/api_category.php');
            const data = await response.json();
            
            data.trivia_categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                this.elements.categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    initializeEventListeners() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.playAgainButton.addEventListener('click', () => this.resetGame());
    }

    async startGame() {
        if (!this.elements.playerNameInput.value) {
            alert('Please enter your name!');
            return;
        }

        this.playerName = this.elements.playerNameInput.value;
        this.timeLeft = parseInt(this.elements.timerInput.value) || 60;
        const category = this.elements.categorySelect.value;
        
        try {
            let apiUrl = 'https://opentdb.com/api.php?amount=10';
            if (category && category !== 'random') {
                apiUrl += `&category=${category}`;
            }
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.response_code === 0) {
                this.questions = data.results;
                this.initializeGameScreen();
            } else {
                throw new Error('Failed to load questions');
            }
        } catch (error) {
            alert('Error loading questions. Please try again.');
            console.error(error);
        }
    }

    initializeGameScreen() {
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        
        this.elements.playerNameDisplay.textContent = this.playerName;
        this.elements.scoreDisplay.textContent = `Score: ${this.score}`;
        
        this.showScreen('game');
        this.displayQuestion();
        this.startTimer();
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        this.elements.questionText.innerHTML = this.decodeHTML(question.question);
        
        // Update question number
        const currentQuestionEl = document.getElementById('current-question');
        if (currentQuestionEl) {
            currentQuestionEl.textContent = this.currentQuestionIndex + 1;
        }

        const answers = [...question.incorrect_answers, question.correct_answer]
            .map(answer => this.decodeHTML(answer));
        this.shuffleArray(answers);
        
        this.elements.answersContainer.innerHTML = '';
        
        // Add answers with staggered animation
        answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.style.animation = `slideIn 0.3s ease-out ${index * 0.1}s both`;
            button.innerHTML = answer;
            button.addEventListener('click', () => this.handleAnswer(answer, question.correct_answer));
            this.elements.answersContainer.appendChild(button);
        });

        this.updateProgress();

        // Add floating effect to question text
        this.elements.questionText.style.animation = 'none';
        this.elements.questionText.offsetHeight; // Trigger reflow
        this.elements.questionText.style.animation = 'floatText 2s ease-in-out infinite';
    }

    handleAnswer(selectedAnswer, correctAnswer) {
        const buttons = this.elements.answersContainer.getElementsByClassName('answer-btn');
        Array.from(buttons).forEach(button => {
            button.disabled = true;
            if (button.innerHTML === this.decodeHTML(correctAnswer)) {
                button.classList.add('correct');
            } else if (button.innerHTML === selectedAnswer) {
                button.classList.add('wrong');
            }
        });

        if (selectedAnswer === this.decodeHTML(correctAnswer)) {
            this.score += 10;
            this.correctAnswers++;
            this.elements.scoreDisplay.textContent = `Score: ${this.score}`;
            this.celebrateCorrectAnswer();
        } else {
            this.showWrongAnswerEffect();
        }

        setTimeout(() => this.nextQuestion(), 1500);
    }

    celebrateCorrectAnswer() {
        confetti({
            particleCount: 400,
            spread: 900,
            origin: { y: 0.6 },
            colors: ['#00ff88', '#00cc6a', '#6B73FF', '#4CAF50']
        });
    }

    showWrongAnswerEffect() {
        const flash = document.createElement('div');
        flash.className = 'wrong-flash';
        document.body.appendChild(flash);
        setTimeout(() => document.body.removeChild(flash), 500);
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.displayQuestion();
        } else {
            this.endGame();
        }
    }

    startTimer() {
        this.elements.timerDisplay.textContent = `${this.timeLeft} secs`;
        clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.elements.timerDisplay.textContent = `${this.timeLeft} secs`;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        clearInterval(this.timer);
        this.saveScore();
        
        this.elements.finalScore.textContent = this.score;
        this.elements.correctAnswersDisplay.textContent = this.correctAnswers;
        
        this.showScreen('result');
        
        // Celebrate with confetti if score is good
        if (this.score > 50) {
            this.celebrateHighScore();
        }
    }

    celebrateHighScore() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#6B73FF', '#FF6B6B', '#00ff88'],
                shapes: ['circle', 'square'],
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#6B73FF', '#FF6B6B', '#00ff88'],
                shapes: ['circle', 'square'],
            });
        }, 250);
    }

    saveScore() {
        if (!this.playerName || this.score === undefined) return;

        const scores = this.getHighScores();
        const newScore = {
            name: this.playerName,
            score: this.score,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now()
        };

        // Add the new score
        scores.push(newScore);
        
        try {
            // Keep only the top 30 scores by timestamp
            const topScores = scores
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 30);
                
            localStorage.setItem('triviaHighScores', JSON.stringify(topScores));
            this.loadHighScores();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    getHighScores() {
        try {
            const scores = localStorage.getItem('triviaHighScores');
            if (!scores) return [];
            
            const parsedScores = JSON.parse(scores);
            return Array.isArray(parsedScores) ? parsedScores : [];
        } catch (error) {
            console.error('Error loading scores:', error);
            return [];
        }
    }

    loadHighScores() {
        const scores = this.getHighScores();
        
        // Clear the current scores display
        this.elements.scoresList.innerHTML = '';
        
        if (scores.length === 0) {
            this.elements.scoresList.innerHTML = `
                <div class="score-item">
                    <div class="score-info">
                        <span class="player-name">No scores yet!</span>
                        <span class="score-date">--</span>
                    </div>
                    <span class="score-value">0</span>
                </div>`;
            return;
        }

        // Remove duplicates keeping highest score per player per day
        const uniqueScores = Object.values(scores.reduce((acc, score) => {
            const key = `${score.name}-${score.date}`;
            if (!acc[key] || acc[key].score < score.score) {
                acc[key] = score;
            }
            return acc;
        }, {}));

        // Sort scores and add ranks
        const scoresToDisplay = uniqueScores
            .sort((a, b) => b.score - a.score || b.timestamp - a.timestamp)
            .map((score, index) => ({
                ...score,
                rank: index + 1
            }));

        // Display scores
        this.elements.scoresList.innerHTML = scoresToDisplay
            .map(score => `
                <div class="score-item ${score.rank <= 3 ? 'top-' + score.rank : ''}">
                    <div class="score-info">
                        <div class="score-header">
                            <span class="rank">#${score.rank}</span>
                            <span class="player-name">${this.escapeHtml(score.name)}</span>
                        </div>
                        <span class="score-date">${score.date}</span>
                    </div>
                    <span class="score-value">${score.score} pts</span>
                </div>`)
            .join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    resetGame() {
        this.showScreen('welcome');
        this.elements.playerNameInput.value = this.playerName;
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
    }

    decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => new TriviaGame());
