function chatApp() {
  return {
    message: '',
    messages: [],
    chatStarted: false,
    isListening: false,
    showSendVoiceButton: false,
    recognition: null,
    tempMessage: '',

    init() {
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              this.tempMessage += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          this.message = this.tempMessage + interimTranscript;
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error', event);
          this.isListening = false;
          this.showSendVoiceButton = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    },

    toggleVoiceInput() {
      if (!this.recognition) return;

      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        this.showSendVoiceButton = false;
      } else {
        this.recognition.start();
        this.isListening = true;
        this.showSendVoiceButton = true;
        this.tempMessage = '';
        this.message = '';
      }
    },

    async sendVoiceResponse() {
      if (!this.tempMessage.trim()) return;

      this.recognition.stop();  // Ensure recognition stops
      this.isListening = false;
      this.showSendVoiceButton = false;
      this.message = this.tempMessage.trim();

      await this.sendMessage();

      this.tempMessage = '';
      this.message = '';
    },

    async sendMessage() {
      console.log('sending message');
      if (!this.message.trim()) return;

      this.messages.push({ sender: 'You', text: this.message });

      try {
        const response = await fetch('https://itp1rd0bwd.execute-api.eu-west-1.amazonaws.com/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: this.message }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        this.messages.push({ sender: 'Bot', text: data.response });
        this.message = '';
        this.chatStarted = true;

        this.$nextTick(() => {
          const chatArea = document.getElementById('chat-area');
          if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        this.messages.push({ sender: 'Error', text: 'Failed to send message. Please try again.' });
      }
    },

    async reset() {
      console.log('resetting');
      this.messages.push({ sender: 'System', text: "Resetting, all data is lost and assistant reset" });
      this.chatStarted = false;

      try {
        const response = await fetch('https://itp1rd0bwd.execute-api.eu-west-1.amazonaws.com/api/chat/reset', {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        this.$nextTick(() => {
          const chatArea = document.getElementById('chat-area');
          if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        this.messages.push({ sender: 'Error', text: 'Failed to send message. Please try again.' });
      }
    },

    async uploadCV() {
      const fileInput = document.getElementById('cvUpload');
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        const response = await fetch('https://itp1rd0bwd.execute-api.eu-west-1.amazonaws.com/api/upload_cv', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        this.messages.push({ sender: 'System', text: `File ${data.filename} uploaded successfully.` });

        const assistantResponse = await this.sendFileToAssistant(data.filename);
        this.messages.push({ sender: 'Bot', text: assistantResponse });

        this.$nextTick(() => {
          const chatArea = document.getElementById('chat-area');
          if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
          }
        });
      } catch (error) {
        console.error('Upload CV Error:', error);
        this.messages.push({ sender: 'Error', text: 'Failed to upload CV. Please try again.' });
      }
    },

    async sendFileToAssistant(filename) {
      try {
        const response = await fetch('https://itp1rd0bwd.execute-api.eu-west-1.amazonaws.com/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: `I have uploaded my CV: ${filename}` }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return data.response;
      } catch (error) {
        console.error('Error sending file to assistant:', error);
        return 'Failed to send file to assistant.';
      }
    },
  };
}

document.addEventListener('alpine:init', () => {
  Alpine.data('chatApp', chatApp);
});


function pollCareer() {
  fetch('https://itp1rd0bwd.execute-api.eu-west-1.amazonaws.com/api/career/getcareer')
      .then(response => response.json())
      .then(data => {
          if (document.getElementById('introduction')) document.getElementById('introduction').innerText = data.introduction || '';
          if (document.getElementById('industry_experience')) document.getElementById('industry_experience').innerText = data.industry_experience || '';
          if (document.getElementById('goals')) document.getElementById('goals').innerText = data.goals || '';
          if (document.getElementById('career_inspiration')) document.getElementById('career_inspiration').innerText = data.career_inspiration || '';
          if (document.getElementById('highlights')) document.getElementById('highlights').innerText = data.highlights || '';
          if (document.getElementById('philosophy')) document.getElementById('philosophy').innerText = data.philosophy || '';
          if (document.getElementById('career_evolution')) document.getElementById('career_evolution').innerText = data.career_evolution || '';
          if (document.getElementById('hardskill_technical_skills')) document.getElementById('hardskill_technical_skills').innerText = data.hardskill_technical_skills || '';
          if (document.getElementById('hardskill_analytical_skills')) document.getElementById('hardskill_analytical_skills').innerText = data.hardskill_analytical_skills || '';
          if (document.getElementById('hardskill_creative_skills')) document.getElementById('hardskill_creative_skills').innerText = data.hardskill_creative_skills || '';
          if (document.getElementById('hardskill_language_skills')) document.getElementById('hardskill_language_skills').innerText = data.hardskill_language_skills || '';
          if (document.getElementById('hardskill_management_skills')) document.getElementById('hardskill_management_skills').innerText = data.hardskill_management_skills || '';
          if (document.getElementById('hardskill_marketing_skills')) document.getElementById('hardskill_marketing_skills').innerText = data.hardskill_marketing_skills || '';
          if (document.getElementById('hardskill_sales_skills')) document.getElementById('hardskill_sales_skills').innerText = data.hardskill_sales_skills || '';
          if (document.getElementById('hardskill_administration_skills')) document.getElementById('hardskill_administration_skills').innerText = data.hardskill_administration_skills || '';
          if (document.getElementById('hardskill_financial_skills')) document.getElementById('hardskill_financial_skills').innerText = data.hardskill_financial_skills || '';
          if (document.getElementById('hardskill_engineering_skills')) document.getElementById('hardskill_engineering_skills').innerText = data.hardskill_engineering_skills || '';
          if (document.getElementById('softskills')) document.getElementById('softskills').innerText = data.softskills || '';
          if (document.getElementById('environment')) document.getElementById('environment').innerText = data.environment || '';
      })
      .catch(error => {
          console.error('Error:', error);
      });
}

pollCareer();
setInterval(pollCareer, 25000);

