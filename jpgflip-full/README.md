# JPGFlip

<!-- Add your logo here when available -->
<!-- ![JPGFlip Logo](./path/to/logo.svg) -->
<!-- Trigger new deploy -->

A high-performance, privacy-first image converter that transforms images between AVIF and JPG formats with exceptional speed and security.

## 🌟 Features

- **Dual Conversion**: Toggle between AVIF→JPG and JPG→AVIF conversion modes
- **100% Client-Side Processing**: All conversions happen directly in your browser - no server uploads required
- **Lightning Fast**: Utilizes Web Workers and parallel processing for optimal performance
- **Batch Processing**: Convert multiple files simultaneously with intelligent download handling
- **Smart Downloads**:
  - Single files download directly in their converted format
  - Multiple files automatically package into a convenient ZIP archive
- **Drag & Drop Interface**: Simple, intuitive user experience
- **Free & Open Source**: No usage limits or hidden costs

## 💻 Technology Stack

- **Frontend**: React with TypeScript for robust, type-safe code
- **Styling**: Tailwind CSS for responsive design
- **Processing**: Web Workers for non-blocking, parallel image conversion
- **Optimization**: FFmpeg WebAssembly for high-performance media processing
- **Packaging**: JSZip for creating downloadable archives of multiple conversions

## 🚀 Getting Started

### Using JPGFlip Online

Simply visit [aviflip.com](https://aviflip.com) to start converting images instantly.

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/brookcs3/aviflip.git
   cd aviflip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## 📑 How It Works

1. **Select Conversion Type**: Toggle between AVIF→JPG or JPG→AVIF mode
2. **Upload Files**: Drag and drop or browse to select your image files
3. **Convert**: Click the convert button to process your images
4. **Download**: Receive your converted images automatically
   - Single file: Downloads directly as converted format
   - Multiple files: Downloads as a ZIP archive

## 🛠️ Advanced Usage

- **Batch Processing**: Upload multiple files to convert them all at once
- **High-Resolution Support**: Works with images of any resolution
- **Format Optimization**: Maintains optimal quality-to-size ratio in conversions

## 🔒 Privacy & Security

- **No Uploads**: All image processing happens locally in your browser
- **No Data Collection**: We don't track, store, or analyze your images
- **No Account Required**: Use instantly without registration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✨ Acknowledgments

- FFmpeg team for their powerful media processing library
- The open-source community for various supporting libraries
