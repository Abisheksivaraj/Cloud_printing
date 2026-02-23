// cSpell:words ATPL Archery Technocrats
import React, { useEffect, useState } from "react";
import { ArrowLeft, X, CheckCircle, Globe, Shield, Zap, Layers, Upload, Users, Headphones, Target } from "lucide-react";
import { useTheme } from "../ThemeContext";

const DetailedInfo = ({ onClose, onBack }) => {
  const { theme, isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const SectionTitle = ({ children, color = "primary" }) => (
    <h2 className={`text-3xl md:text-4xl font-black mb-6 tracking-tight ${color === "secondary" ? "text-[var(--color-secondary)]" : "text-[var(--color-primary)]"
      }`}>
      {children}
    </h2>
  );

  const SectionText = ({ children }) => (
    <p className="text-base md:text-lg leading-relaxed mb-6 font-medium" style={{ color: theme.textMuted }}>
      {children}
    </p>
  );

  const FeatureItem = ({ title, children, icon: Icon }) => (
    <div
      className="p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:translate-x-1 border-l-4 group"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderLeftColor: 'var(--color-secondary)'
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="text-[var(--color-secondary)]" size={24} />}
        <h3 className="text-xl font-bold text-[var(--color-secondary)]">{title}</h3>
      </div>
      <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.text }}>
        {children}
      </p>
    </div>
  );

  const InfoSection = ({ children, className = "", animateDelay = 0 }) => (
    <div
      className={`p-8 rounded-3xl border shadow-sm transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        transitionDelay: `${animateDelay}ms`
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      <div
        className="w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: theme.bg }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b bg-white dark:bg-gray-800 shrink-0 z-10" style={{ borderColor: theme.border }}>
          <button
            onClick={onBack}
            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center flex-1 px-4">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ color: theme.text }}>
              About ATPL Cloud Printing
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mt-1" style={{ color: theme.textMuted }}>
              Detailed Information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Introduction */}
            <InfoSection className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-900 border-l-8 border-l-[var(--color-secondary)]" animateDelay={50}>
              <SectionTitle color="secondary">Welcome to ATPL Cloud Printing</SectionTitle>
              <SectionText>
                ATPL Cloud Printing is a revolutionary label design and management solution developed by Archery Technocrats Private Limited. Our platform represents the pinnacle of label printing technology, combining intuitive design tools with powerful cloud-based capabilities to deliver unmatched efficiency and precision in label creation and production.
              </SectionText>
            </InfoSection>

            {/* Key Features */}
            <InfoSection className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 border-l-8 border-l-[var(--color-primary)]" animateDelay={100}>
              <SectionTitle>Key Features & Capabilities</SectionTitle>
              <div className="grid gap-6">
                <FeatureItem title="Professional Design Tools" icon={Layers}>
                  Our comprehensive suite of design tools enables you to create stunning labels with ease. From basic text elements to complex barcodes and QR codes, every tool is crafted with precision and user experience in mind. The intuitive drag-and-drop interface makes label design accessible to both beginners and professionals alike.
                </FeatureItem>

                <FeatureItem title="Advanced Barcode Support" icon={Zap}>
                  Generate multiple barcode formats including Code 128, Code 39, EAN-13, EAN-8, UPC-A, QR Codes, Data Matrix, PDF417, and Aztec codes. Our barcode engine ensures perfect rendering and compliance with international standards, making your labels scan-ready for any application.
                </FeatureItem>

                <FeatureItem title="Cloud-Based Architecture" icon={Globe}>
                  Access your label designs from anywhere, at any time. Our secure cloud infrastructure ensures your data is safely stored and always available when you need it. Collaborate with team members in real-time and maintain version control effortlessly.
                </FeatureItem>

                <FeatureItem title="Data Import & Automation" icon={Upload}>
                  Streamline your workflow by importing data from Excel and CSV files. Our intelligent mapping system automatically matches your data columns with label placeholders, enabling bulk label generation with just a few clicks. Perfect for inventory management, shipping labels, and product tagging.
                </FeatureItem>
              </div>
            </InfoSection>

            {/* Industries & Applications */}
            <InfoSection className="bg-blue-50/50 dark:bg-blue-900/10 border-l-8 border-l-[var(--color-primary)]" animateDelay={150}>
              <SectionTitle>Industries & Applications</SectionTitle>
              <SectionText>
                ATPL Cloud Printing serves a diverse range of industries including retail, manufacturing, logistics, healthcare, food and beverage, and e-commerce. Whether you need product labels, shipping labels, asset tags, compliance labels, or marketing materials, our platform adapts to your specific requirements. The flexibility of our system allows customization for industry-specific regulations and standards.
              </SectionText>
            </InfoSection>

            {/* Technical Excellence */}
            <InfoSection animateDelay={200}>
              <SectionTitle>Technical Excellence</SectionTitle>
              <SectionText>
                Built on cutting-edge web technologies, ATPL Cloud Printing delivers exceptional performance and reliability. Our platform utilizes responsive design principles, ensuring seamless operation across desktop computers, tablets, and mobile devices. The application features real-time preview capabilities, allowing you to see exactly how your labels will look before printing.
              </SectionText>
              <SectionText>
                With support for high-resolution printing up to 600 DPI, your labels will always look professional and sharp. Our color management system ensures accurate color reproduction, while the precision measurement tools (supporting both millimeters and inches) guarantee perfect sizing every time.
              </SectionText>
            </InfoSection>

            {/* Workflow Efficiency */}
            <InfoSection className="bg-green-50/50 dark:bg-green-900/10 border-l-8 border-l-[var(--color-success)]" animateDelay={250}>
              <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight text-[var(--color-success)]">
                Enhanced Workflow Efficiency
              </h2>
              <SectionText>
                Save time and reduce errors with our template system. Create reusable label templates that can be quickly adapted for different products or purposes. The batch processing feature allows you to generate hundreds or thousands of labels from imported data, with intelligent filtering and selection options to process exactly the records you need.
              </SectionText>
            </InfoSection>

            {/* Support & Training */}
            <InfoSection animateDelay={300}>
              <SectionTitle>Support & Innovation</SectionTitle>
              <div className="flex gap-6 items-start">
                <div className="p-4 bg-[var(--color-primary)]/10 rounded-2xl hidden md:block">
                  <Headphones className="text-[var(--color-primary)]" size={40} />
                </div>
                <div>
                  <SectionText>
                    Archery Technocrats is committed to providing exceptional customer support and continuous product improvement. Our dedicated support team is available to assist with any questions or challenges you may encounter. Regular updates bring new features, performance enhancements, and security improvements.
                  </SectionText>
                  <SectionText>
                    We actively listen to customer feedback and incorporate user suggestions into our development roadmap. This customer-centric approach has made ATPL Cloud Printing the preferred choice for businesses of all sizes, from small startups to large enterprises.
                  </SectionText>
                </div>
              </div>
            </InfoSection>

            {/* Company Mission */}
            <InfoSection className="bg-pink-50/50 dark:bg-pink-900/10 border-l-8 border-l-[var(--color-secondary)]" animateDelay={350}>
              <div className="flex items-center gap-4 mb-6">
                <Target className="text-[var(--color-secondary)]" size={40} />
                <SectionTitle color="secondary">Our Mission: Target Perfection</SectionTitle>
              </div>
              <SectionText>
                At Archery Technocrats, we don't just aim for excellence—we target perfection. This philosophy drives every aspect of ATPL Cloud Printing, from the precision of our measurement tools to the clarity of our user interface. We believe that great software should empower users to achieve their goals efficiently while maintaining the highest standards of quality and reliability.
              </SectionText>
              <SectionText>
                Our vision is to make professional label design accessible to everyone, eliminating the complexity traditionally associated with label creation software. By combining powerful features with intuitive design, we enable businesses to create perfect labels that enhance their brand image and streamline their operations. ATPL Cloud Printing represents our commitment to innovation, quality, and customer success.
              </SectionText>
            </InfoSection>

            {/* Contact Information */}
            <InfoSection className="bg-gradient-to-br from-blue-50 to-pink-50 dark:from-blue-900/20 dark:to-pink-900/20 border-l-8 border-l-[var(--color-primary)]" animateDelay={400}>
              <SectionTitle>Get In Touch</SectionTitle>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <SectionText>
                    For more information about ATPL Cloud Printing or to discuss how our solution can benefit your organization, please visit our website or contact our sales team. We offer personalized demonstrations and can help you determine the best configuration for your specific needs.
                  </SectionText>
                </div>
                <Users className="text-[var(--color-primary)] hidden md:block opacity-20" size={120} />
              </div>

              <a
                href="https://www.atplgroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-3 w-full p-4 rounded-xl border-2 border-[var(--color-primary)] bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:-translate-y-1 hover:shadow-lg group"
              >
                <Globe className="text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold text-[var(--color-primary)]">www.atplgroup.com</span>
              </a>
            </InfoSection>

          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-6 md:p-8 border-t flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-gray-800" style={{ borderColor: theme.border }}>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
            <Shield size={14} />
            <span>Secure Enterprise Protocol</span>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={onBack}
              className="flex-1 md:flex-none btn btn-outline py-3 px-6 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 md:flex-none btn btn-primary py-3 px-8 text-base shadow-lg hover:shadow-primary/30"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedInfo;
