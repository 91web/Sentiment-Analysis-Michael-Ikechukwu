document.addEventListener("DOMContentLoaded", () => {
  // IMPORTANT: Replace this with your actual Gemini API key
 // const GEMINI_API_KEY = "AIzaSyCb5w3ZtaGsIh11KBck2BTBpG0h12FNp54";

  // Loading screen
  const loadingScreen = document.getElementById("loading-screen");

  // Simulate loading time (remove this in production and use the window.onload event)
  setTimeout(() => {
    loadingScreen.classList.add("fade-out");
    // Remove from DOM after animation completes
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  }, 8000); // Show loader for 2 seconds

  // DOM elements
  const apiKeyInput = document.getElementById("api-key");
  const saveApiKeyButton = document.getElementById("save-api-key");
  const apiKeyStatus = document.getElementById("api-key-status");
  const languageSelect = document.getElementById("language");
  const textArea = document.getElementById("text");
  const analyzeButton = document.getElementById("analyze-button");
  const clearButton = document.getElementById("clear-button");
  const errorMessage = document.getElementById("error-message");
  const resultContainer = document.getElementById("result-container");
  const sentimentBadge = document.getElementById("sentiment-badge");
  const confidenceValue = document.getElementById("confidence-value");
  const resultIcon = document.getElementById("result-icon");
  const resultDetails = document.getElementById("result-details");
  const resultExplanation = document.getElementById("result-explanation");
  const historyContainer = document.getElementById("history-container");
  const historyList = document.getElementById("history-list");
  const clearHistoryButton = document.getElementById("clear-history");

  // API Key management
  // let apiKey = localStorage.getItem("gemini_api_key")

  // if (apiKey) {
  //   apiKeyInput.value = "••••••••••••••••••••••••••"
  //   apiKeyStatus.textContent = "API Key saved"
  //   apiKeyStatus.classList.add("success")
  //   analyzeButton.disabled = false
  // }

  // saveApiKeyButton.addEventListener("click", () => {
  //   const key = apiKeyInput.value.trim()

  //   if (!key) {
  //     apiKeyStatus.textContent = "Please enter an API key"
  //     apiKeyStatus.classList.remove("success")
  //     apiKeyStatus.classList.add("error")
  //     return
  //   }

  //   // Save API key to local storage
  //   localStorage.setItem("gemini_api_key", key)
  //   apiKey = key

  //   // Update UI
  //   apiKeyInput.value = "••••••••••••••••••••••••••"
  //   apiKeyStatus.textContent = "API Key saved successfully"
  //   apiKeyStatus.classList.remove("error")
  //   apiKeyStatus.classList.add("success")
  //   analyzeButton.disabled = false
  // })

  // Event listeners
  analyzeButton.addEventListener("click", handleAnalyze);
  clearButton.addEventListener("click", clearInput);
  clearHistoryButton.addEventListener("click", clearHistory);
  textArea.addEventListener("input", validateInput);

  // Load history from localStorage
  loadHistory();

  function validateInput() {
    if (textArea.value.trim()) {
      analyzeButton.disabled = false;
      errorMessage.textContent = "";
      errorMessage.classList.remove("visible");
    } else {
      analyzeButton.disabled = true;
    }
  }

  function clearInput() {
    textArea.value = "";
    resultContainer.classList.add("hidden");
    errorMessage.textContent = "";
    errorMessage.classList.remove("visible");
    analyzeButton.disabled = true;
  }

  function clearHistory() {
    localStorage.removeItem("sentiment_history");
    historyList.innerHTML = "";
    historyContainer.classList.add("hidden");
  }

  async function handleAnalyze() {
    const text = textArea.value.trim();
    const language = languageSelect.value;

    if (!text) {
      errorMessage.textContent = "Please enter some text to analyze";
      errorMessage.classList.add("visible");
      return;
    }

    // if (!apiKey) {
    //   errorMessage.textContent = "Please enter your Gemini API key"
    //   errorMessage.classList.add("visible")
    //   return
    // }

    // Show loading state
    analyzeButton.disabled = true;
    analyzeButton.classList.add("button-loading");
    analyzeButton.textContent = "Analyzing...";

    try {
      const result = await analyzeSentiment(text, language);
      displayResult(result);
      saveToHistory(text, result);
    } catch (err) {
      errorMessage.textContent = "Failed to analyze sentiment: " + err.message;
      errorMessage.classList.add("visible");
      console.error(err);
    } finally {
      // Reset button state
      analyzeButton.disabled = false;
      analyzeButton.classList.remove("button-loading");
      analyzeButton.textContent = "Analyze Sentiment";
    }
  }

  function displayResult(result) {
    // Show result container
    resultContainer.classList.remove("hidden");

    // Update sentiment badge
    sentimentBadge.textContent = capitalizeFirstLetter(result.sentiment);
    sentimentBadge.className = "badge badge-" + result.sentiment;

    // Update confidence value
    confidenceValue.textContent = Math.round(result.confidence * 100) + "%";

    // Update icon
    resultIcon.innerHTML = getSentimentIcon(result.sentiment);

    // Update explanation if available
    if (result.explanation) {
      resultExplanation.textContent = result.explanation;
      resultDetails.classList.remove("hidden");
    } else {
      resultExplanation.textContent = "No detailed explanation available.";
      resultDetails.classList.add("hidden");
    }
  }

  function saveToHistory(text, result) {
    // Get existing history or initialize empty array
    const history = JSON.parse(
      localStorage.getItem("sentiment_history") || "[]"
    );

    // Add new entry (limit to first 50 characters for display)
    const displayText = text.length > 50 ? text.substring(0, 50) + "..." : text;

    const historyEntry = {
      text: displayText,
      fullText: text,
      sentiment: result.sentiment,
      confidence: result.confidence,
      explanation: result.explanation,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of array (most recent first)
    history.unshift(historyEntry);

    // Limit history to 10 items
    if (history.length > 10) {
      history.pop();
    }

    // Save back to localStorage
    localStorage.setItem("sentiment_history", JSON.stringify(history));

    // Update UI
    loadHistory();
  }

  function loadHistory() {
    const history = JSON.parse(
      localStorage.getItem("sentiment_history") || "[]"
    );

    if (history.length === 0) {
      historyContainer.classList.add("hidden");
      return;
    }

    // Show history container
    historyContainer.classList.remove("hidden");

    // Clear existing items
    historyList.innerHTML = "";

    // Add history items
    history.forEach((entry) => {
      const template = document.getElementById("history-item-template");
      const clone = document.importNode(template.content, true);

      const historyItem = clone.querySelector(".history-item");
      const textElement = clone.querySelector(".history-item-text");
      const badgeElement = clone.querySelector(".history-item-badge");
      const summaryElement = clone.querySelector(".history-item-summary");

      textElement.textContent = entry.text;

      // Create badge
      badgeElement.textContent = capitalizeFirstLetter(entry.sentiment);
      badgeElement.classList.add("badge", `badge-${entry.sentiment}`);

      // Add summary
      summaryElement.textContent = entry.explanation
        ? entry.explanation.substring(0, 100) +
          (entry.explanation.length > 100 ? "..." : "")
        : "No explanation available";

      // Add click event to load this text for re-analysis
      historyItem.addEventListener("click", () => {
        textArea.value = entry.fullText;
        validateInput();
        // Scroll to input area
        textArea.scrollIntoView({ behavior: "smooth" });
      });

      historyList.appendChild(clone);
    });
  }

  function getSentimentIcon(sentiment) {
    switch (sentiment) {
      case "positive":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(
          document.documentElement
        ).getPropertyValue(
          "--positive"
        )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>`;
      case "negative":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(
          document.documentElement
        ).getPropertyValue(
          "--negative"
        )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>`;
      case "neutral":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${getComputedStyle(
          document.documentElement
        ).getPropertyValue(
          "--neutral"
        )}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>`;
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Gemini API integration
  async function analyzeSentiment(text, language) {
    try {
      // Use the hardcoded API key
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("Please set your Gemini API key in the script.js file");
      }

      // Gemini API endpoint - using gemini-2.0-flash model as specified
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      // Create prompt for sentiment analysis
      const prompt = `
        Analyze the sentiment of the following text in ${language}. 
        Classify it as exactly one of these categories: "positive", "negative", or "neutral".
        Also provide a confidence score between 0 and 1.
        Provide a brief explanation of why you classified it this way.
        
        Format your response as a JSON object with the following structure:
        {
          "sentiment": "positive", 
          "confidence": 0.95,
          "explanation": "The text contains positive language..."
        }
        
        Only return the JSON object, nothing else.
        
        Text to analyze: "${text}"
      `;

      // Make request to Gemini API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();

      // Extract the text response from Gemini
      const textResponse = data.candidates[0].content.parts[0].text;

      // Parse the JSON response
      // Find the JSON object in the response (in case there's any extra text)
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from API");
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);

      // Validate the response
      if (
        !jsonResponse.sentiment ||
        !["positive", "negative", "neutral"].includes(jsonResponse.sentiment)
      ) {
        throw new Error("Invalid sentiment value in API response");
      }

      if (
        typeof jsonResponse.confidence !== "number" ||
        jsonResponse.confidence < 0 ||
        jsonResponse.confidence > 1
      ) {
        // If confidence is missing or invalid, use a default value
        jsonResponse.confidence = 0.7;
      }

      return {
        sentiment: jsonResponse.sentiment,
        confidence: jsonResponse.confidence,
        explanation: jsonResponse.explanation || null,
      };
    } catch (error) {
      console.error("Error in analyzeSentiment:", error);
      throw error;
    }
  }

  // Initialize
  validateInput();
});
