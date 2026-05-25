# Adaptive Denoising Frontend

A modern, responsive web application for AI-powered audio denoising built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Glass morphism design with smooth animations
- **Real-time Processing**: Upload audio files and track processing status in real-time
- **API Key Management**: Secure API key generation and management
- **Multiple Processing Modes**: Basic, aggressive, and gentle denoising options
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **TypeScript**: Full type safety throughout the application
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **HTTP Client**: Axios
- **Icons**: Heroicons (via SVG)
- **Fonts**: Outfit (Google Fonts)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see adaptive-denoising-backend)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adaptive-denoising-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── denoise/          # Audio processing page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
└── lib/
    └── api.ts            # API client and types
```

## 🔌 API Integration

The frontend integrates with the backend API through the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `GET /auth/me` - Get current user

### API Keys
- `GET /api-keys` - List user's API keys
- `POST /api-keys` - Create new API key
- `PUT /api-keys/:id/deactivate` - Deactivate API key
- `DELETE /api-keys/:id` - Delete API key

### Audio Processing
- `POST /audio/denoise` - Upload audio for processing
- `GET /audio/jobs/:id` - Get job status
- `GET /audio/jobs/:id/download` - Download processed audio

## 🎨 Styling

The application uses a custom design system with:

- **Glass Morphism**: Translucent cards with backdrop blur
- **Dark Theme**: Optimized for low-light usage
- **Responsive Design**: Mobile-first approach
- **Custom Properties**: CSS variables for consistent theming
- **Animations**: Smooth transitions and micro-interactions

### Color Palette
- Primary: `#3b82f6` (Blue)
- Background: `#0a0a0b` (Near Black)
- Foreground: `#f4f4f5` (Off White)
- Muted: `#a1a1aa` (Gray)
- Destructive: `#ef4444` (Red)
- Success: `#10b981` (Green)

## 🔒 Security Features

- **JWT Token Management**: Automatic token refresh and storage
- **API Key Security**: Keys shown only once upon creation
- **Input Validation**: Client-side validation for all forms
- **Error Handling**: Secure error messages without sensitive data
- **HTTPS Ready**: Production-ready security headers

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: `< 640px`
- Tablet: `640px - 1024px`  
- Desktop: `> 1024px`

## ♿ Accessibility

- **WCAG 2.1 AA Compliant**: Meets accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Support for high contrast preferences
- **Reduced Motion**: Respects user motion preferences

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality
- **ESLint**: Configured with Next.js recommended rules
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting (configure as needed)

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend app URL
- `NEXT_PUBLIC_MAX_FILE_SIZE_MB` - Maximum file upload size

### Customization
- **Colors**: Modify CSS variables in `globals.css`
- **Fonts**: Update font imports in `layout.tsx`
- **API Client**: Extend `api.ts` for additional endpoints

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running
   - Verify `NEXT_PUBLIC_API_URL` in environment variables
   - Check CORS settings in backend

2. **File Upload Issues**
   - Verify file size limits
   - Check supported file formats
   - Ensure proper API key authentication

3. **Authentication Problems**
   - Clear localStorage and try again
   - Check JWT token expiration
   - Verify backend authentication endpoints

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the troubleshooting section

---

Built with ❤️ using Next.js and TypeScript
