# Supportly - Video Support Call Scheduling Platform

A modern video call customer support application built with React Router v7, TypeScript, and Tailwind CSS. This platform allows customers to easily schedule video calls with support teams to resolve issues and get product assistance.

## 🚀 Features

### Customer Features
- **Easy Session Booking**: Schedule video support sessions with a simple form
- **Real-time Video Calls**: High-quality video calls with screen sharing capabilities
- **Session Management**: View upcoming and completed sessions
- **Profile Management**: Update personal information and preferences
- **Session History**: Track all past sessions with ratings and feedback

### Admin/Support Team Features
- **Admin Dashboard**: Comprehensive overview of all support sessions
- **Team Management**: Manage support team members and their availability
- **Schedule Management**: Set available time slots and manage bookings
- **Session Analytics**: Track performance metrics and customer satisfaction

### Technical Features
- 🎥 **Video Call Integration**: Browser-based video calls (no additional software required)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔒 **Authentication System**: Secure login/signup with password recovery
- 📊 **Real-time Chat**: In-session messaging between customers and support agents
- 🎯 **Smart Scheduling**: Flexible time slot management with availability controls

## 📁 Project Structure

```
app/
├── routes/
│   ├── home.tsx                    # Landing page with features overview
│   ├── book-session.tsx           # Session booking form
│   ├── booking-confirmation.tsx   # Booking success page
│   ├── dashboard.tsx              # Admin dashboard for support team
│   ├── profile.tsx                # Customer profile and session history
│   ├── video-call.$sessionId.tsx  # Video call interface
│   └── auth/
│       ├── layout.tsx             # Auth pages layout
│       ├── login.tsx              # User login
│       ├── signup.tsx             # User registration
│       ├── forgot-password.tsx    # Password recovery
│       └── logout.tsx             # Logout confirmation
├── app.css                        # Global styles with Tailwind
├── root.tsx                       # Root application component
└── routes.ts                      # Route configuration
```

## 🎨 Pages Overview

### 1. **Landing Page** (`/`)
- Hero section with clear value proposition
- Feature highlights (Easy Video Calls, Smart Scheduling, Issue Resolution)
- Call-to-action buttons for booking sessions and accessing dashboard
- Professional design with gradient backgrounds and modern UI

### 2. **Book Session** (`/book-session`)
- Comprehensive booking form with customer information
- Date and time slot selection with real-time availability
- Session topic and experience level selection
- Visual session summary and confirmation

### 3. **Video Call Interface** (`/video-call/:sessionId`)
- Full-screen video call experience
- Local and remote video streams
- Call controls (mute, video toggle, screen share, end call)
- Real-time chat sidebar for text communication
- Session duration tracking and participant information

### 4. **Admin Dashboard** (`/dashboard`)
- Session management with filtering and status tracking
- Team availability scheduling with day-wise time slots
- Performance metrics and statistics overview
- Team member management interface

### 5. **Customer Profile** (`/profile`)
- Personal information management
- Upcoming sessions overview with join links
- Complete session history with ratings and feedback
- Preference settings for scheduling

### 6. **Authentication Pages** (`/auth/*`)
- Modern login/signup forms with consistent branding
- Password recovery workflow with email confirmation
- Responsive design with background imagery
- Form validation and user feedback

## 🛠 Technology Stack

- **Frontend Framework**: React Router v7
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Package Manager**: npm
- **Deployment**: Docker-ready with multi-stage builds

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GoldenThrust/Supportly.git
   cd Supportly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
# Build the image
docker build -t supportly .

# Run the container
docker run -p 3000:3000 supportly
```

## 🎯 Integration Guide

This project is designed to be easily integrated into existing applications. Here's how to use it:

### 1. **As a Standalone Application**
- Clone the repository and customize the branding
- Configure your video calling service (WebRTC, Agora, Twilio, etc.)
- Set up your backend API endpoints
- Deploy to your preferred hosting platform

### 2. **Integration into Existing Apps**
- Copy the relevant page components to your project
- Adapt the routing structure to match your application
- Customize the styling to match your brand guidelines
- Integrate with your existing authentication system

### 3. **Customization Options**
- **Branding**: Update colors, fonts, and logos in Tailwind config and components
- **Features**: Enable/disable features like screen sharing, chat, recording
- **Scheduling**: Customize time slots, duration options, and availability rules
- **Notifications**: Add email/SMS notifications for booking confirmations

## 🔧 Configuration

### Environment Variables
Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development

# Database Configuration
DB_DIALECT=postgresql
DB_NAME=supportly
DB_USER=postgres
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgres://postgres:root@localhost:5432/supportly

# Video Service Configuration (add your preferred service)
# AGORA_APP_ID=your_agora_app_id
# TWILIO_ACCOUNT_SID=your_twilio_sid
# WEBRTC_CONFIG=your_webrtc_config
```

### Customizing Styling
The application uses Tailwind CSS with custom theme configuration. Update `app/app.css` and component styles to match your brand:

```css
@theme {
  --color-primary: your-primary-color;
  --color-secondary: your-secondary-color;
  --font-family: your-preferred-font;
}
```

## 📝 Usage Examples

### Booking a Session
1. Navigate to the landing page
2. Click "Book a Support Session"
3. Fill in your information and select a time slot
4. Receive confirmation with meeting details
5. Join the video call at the scheduled time

### Managing Sessions (Admin)
1. Access the dashboard at `/dashboard`
2. View all upcoming and completed sessions
3. Manage team availability in the Schedule tab
4. Add or remove team members in the Team tab

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React Router v7 for modern routing capabilities
- Styled with Tailwind CSS for rapid UI development
- Icons provided by Heroicons
- Video calling capabilities ready for integration with WebRTC, Agora, or Twilio

## 📞 Support

For questions and support, please contact:
- Email: support@supportly.com
- GitHub Issues: [Create an issue](https://github.com/GoldenThrust/Supportly/issues)

---

**Supportly** - Making customer support conversations more human, one video call at a time. 🎥✨
