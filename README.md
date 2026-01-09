# AniRec - Anime Recommendation App

A modern, interactive anime recommendation application that connects to your AniList profile to provide personalized anime suggestions based on your viewing history and preferences.

## ✨ Features

- **Personalized Recommendations**: Get anime suggestions based on your AniList profile and viewing history
- **Interactive Card Pack System**: Discover new anime through an engaging card pack opening experience with smooth animations
- **Advanced Filtering**: Filter recommendations by:
  - Genres
  - Streaming services (Netflix, Crunchyroll, Funimation, Hulu, Disney+, Prime Video, HIDIVE)
  - User ratings and popularity
- **User Statistics**: View detailed stats about your anime watching habits
- **Dark/Light Theme**: Toggle between dark and light modes
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Data**: Fetches live data from AniList's GraphQL API

## 🚀 Live Demo

[Try AniRec Live](https://your-username.github.io/AnilistSuggestion) *(Update this link after deployment)*

## 🛠️ Technologies Used

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Variables for theming
- **Animations**: Framer Motion
- **Data Fetching**: TanStack React Query
- **API**: AniList GraphQL API
- **Deployment**: GitHub Pages (or your preferred platform)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/AnilistSuggestion.git
cd AnilistSuggestion
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎮 How to Use

1. **Enter Your AniList Username**: Input your AniList username to load your anime list
2. **View Your Stats**: See your watching statistics and preferences
3. **Apply Filters**: Use the filter panel to narrow down recommendations by genre or streaming service
4. **Open Card Packs**: Click on the card pack to reveal a random anime recommendation
5. **Explore Details**: Click on any anime card to view detailed information including synopsis, ratings, and streaming availability

## 🎯 Key Components

- **AnimeRoulette**: Interactive card pack system with tear animations
- **FilterPanel**: Advanced filtering options for genres and streaming services
- **UserStats**: Display user's anime watching statistics
- **AnimeModal**: Detailed anime information popup
- **RecommendationGrid**: Grid layout for browsing multiple recommendations

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── api/           # AniList API integration
├── components/    # React components
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## 🌟 Features in Detail

### Card Pack Animation System
The app features a unique card pack opening experience with:
- Tension buildup animation
- Realistic tearing effects
- Foil reveal animations
- Smooth card transitions

### Smart Recommendation Engine
- Analyzes your completed anime list
- Considers your rating patterns
- Factors in genre preferences
- Excludes anime you've already seen

### Streaming Service Integration
Automatically detects which streaming platforms have each anime available, helping you find content you can actually watch.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [AniList](https://anilist.co/) for providing the comprehensive anime database API
- [Vite](https://vitejs.dev/) for the lightning-fast build tool
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- The React and TypeScript communities for excellent tooling

## 📞 Contact

Your Name - [@your-twitter](https://twitter.com/your-twitter) - your.email@example.com

Project Link: [https://github.com/your-username/AnilistSuggestion](https://github.com/your-username/AnilistSuggestion)

---

⭐ If you found this project helpful, please give it a star on GitHub!