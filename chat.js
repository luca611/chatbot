const apiKey = 'your-api-key';

async function getGroqChatCompletion(userMessage) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: "(chat history)" + getLastFiveAssistantAnswers() + "(answer guideline)" + "when writing code MUST use this structure <pre> <span> <b>code lang</b> </span> <div class='code'><code>'answer code'</code></div></pre>" + "(new question)" + userMessage }],
            model: 'llama3-70b-8192'
        })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
}

async function displayChatMessage(message, isUser = false, isHistory = false) {
    message = transformBold(message);
    message = replaceNewLine(message);
    const chatLog = document.getElementById('chat-log');
    const messageContainer = document.createElement('div');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageContainer.className = 'answerContainer';
    messageElement.className = isUser ? 'userMessage' : 'aiMessage';
    messageContainer.appendChild(messageElement);
    chatLog.appendChild(messageContainer);
    scrollToBottom("chat-log");

    if (!isHistory) {
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        chatHistory.push({ message, isUser });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
}

document.getElementById('user-input').addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
        const userInput = document.getElementById('user-input');
        const userMessage = userInput.value;

        // Display user's message
        await displayChatMessage(userMessage, true);

        // Get and display the response from Groq API
        const responseMessage = await getGroqChatCompletion(userMessage);
        await displayChatMessage(responseMessage);

        // Clear input field
        userInput.value = '';
    }
});

document.getElementById('send-button').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input');
    const userMessage = userInput.value;

    // Display user's message
    await displayChatMessage(userMessage, true);

    // Get and display the response from Groq API
    const responseMessage = await getGroqChatCompletion(userMessage);
    await displayChatMessage(responseMessage);

    // Clear input field
    userInput.value = '';
});

// Load chat history from local storage on page load
window.addEventListener('load', () => {
    scrollToBottom("chat-log");
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(({ message, isUser }) => {
        displayChatMessage(message, isUser, true);
    });
});

//speech recognition
document.getElementById('startButton').addEventListener('click', function () {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    const selectedLanguage = document.getElementById('language-select').value;
    recognition.lang = selectedLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
    };

    recognition.onspeechend = function () {
        recognition.stop();
    };

    recognition.onerror = function (event) {
        console.log('Error occurred in recognition. Try again.');
    };
});

// Save language preference to local storage
const saveLanguagePreference = (language) => {
    localStorage.setItem('languagePreference', language);
};

// Load language preference from local storage on page load
const loadLanguagePreference = () => {
    const languagePreference = localStorage.getItem('languagePreference');
    if (languagePreference) {
        document.getElementById('language-select').value = languagePreference;
    }
};

// Call the loadLanguagePreference function on page load
window.addEventListener('load', loadLanguagePreference);

document.getElementById('language-select').addEventListener('change', function () {
    const selectedLanguage = this.value;
    saveLanguagePreference(selectedLanguage);
});

function transformBold(content) {
    return content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
}

function replaceNewLine(content) {
    return content.replace(/\n/g, '<br>');
}


function getLastFiveAssistantAnswers() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const assistantAnswers = chatHistory.filter(({ isUser }) => !isUser);
    const lastFiveAnswers = assistantAnswers.slice(-Math.min(5, assistantAnswers.length));
    const answersString = lastFiveAnswers.map(({ message }) => message).join('\n');
    return answersString;
}

function scrollToBottom() {
    const div = document.getElementById("chat-log");
    div.scrollTop = div.scrollHeight;
  }

  window.onload = scrollToBottom();