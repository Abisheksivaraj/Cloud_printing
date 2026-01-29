// cSpell:words ATPL Archery Technocrats
import React from "react";
import { ArrowLeft, X } from "lucide-react";
import "./DetailedInfo.css";

const DetailedInfo = ({ onClose, onBack }) => {
  return (
    <div className="detailed-info-overlay">
      <div className="detailed-info-container">
        {/* Header */}
        <div className="detailed-info-header">
          <button onClick={onBack} className="icon-button" aria-label="Back">
            <ArrowLeft size={24} />
          </button>
          <div className="header-content">
            <h1 className="detailed-info-title">About ATPL Cloud Printing</h1>
            <p className="detailed-info-subtitle">Detailed Information</p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="detailed-info-content">
          <div className="content-wrapper">
            {/* Introduction */}
            <section className="info-section intro-card">
              <h2 className="section-title-main">
                Welcome to ATPL Cloud Printing
              </h2>
              <p className="section-text">
                ATPL Cloud Printing is a revolutionary label design and
                management solution developed by Archery Technocrats Private
                Limited. Our platform represents the pinnacle of label printing
                technology, combining intuitive design tools with powerful
                cloud-based capabilities to deliver unmatched efficiency and
                precision in label creation and production.
              </p>
            </section>

            {/* Key Features */}
            <section className="info-section features-card">
              <h2 className="section-title-blue">
                Key Features & Capabilities
              </h2>

              <div className="feature-item">
                <h3 className="feature-title">Professional Design Tools</h3>
                <p className="section-text">
                  Our comprehensive suite of design tools enables you to create
                  stunning labels with ease. From basic text elements to complex
                  barcodes and QR codes, every tool is crafted with precision
                  and user experience in mind. The intuitive drag-and-drop
                  interface makes label design accessible to both beginners and
                  professionals alike.
                </p>
              </div>

              <div className="feature-item">
                <h3 className="feature-title">Advanced Barcode Support</h3>
                <p className="section-text">
                  Generate multiple barcode formats including Code 128, Code 39,
                  EAN-13, EAN-8, UPC-A, QR Codes, Data Matrix, PDF417, and Aztec
                  codes. Our barcode engine ensures perfect rendering and
                  compliance with international standards, making your labels
                  scan-ready for any application.
                </p>
              </div>

              <div className="feature-item">
                <h3 className="feature-title">Cloud-Based Architecture</h3>
                <p className="section-text">
                  Access your label designs from anywhere, at any time. Our
                  secure cloud infrastructure ensures your data is safely stored
                  and always available when you need it. Collaborate with team
                  members in real-time and maintain version control
                  effortlessly.
                </p>
              </div>

              <div className="feature-item">
                <h3 className="feature-title">Data Import & Automation</h3>
                <p className="section-text">
                  Streamline your workflow by importing data from Excel and CSV
                  files. Our intelligent mapping system automatically matches
                  your data columns with label placeholders, enabling bulk label
                  generation with just a few clicks. Perfect for inventory
                  management, shipping labels, and product tagging.
                </p>
              </div>
            </section>

            {/* Industries & Applications */}
            <section className="info-section highlight-card">
              <h2 className="section-title-blue">Industries & Applications</h2>
              <p className="section-text">
                ATPL Cloud Printing serves a diverse range of industries
                including retail, manufacturing, logistics, healthcare, food and
                beverage, and e-commerce. Whether you need product labels,
                shipping labels, asset tags, compliance labels, or marketing
                materials, our platform adapts to your specific requirements.
                The flexibility of our system allows customization for
                industry-specific regulations and standards.
              </p>
            </section>

            {/* Technical Excellence */}
            <section className="info-section">
              <h2 className="section-title-blue">Technical Excellence</h2>
              <p className="section-text">
                Built on cutting-edge web technologies, ATPL Cloud Printing
                delivers exceptional performance and reliability. Our platform
                utilizes responsive design principles, ensuring seamless
                operation across desktop computers, tablets, and mobile devices.
                The application features real-time preview capabilities,
                allowing you to see exactly how your labels will look before
                printing.
              </p>
              <p className="section-text">
                With support for high-resolution printing up to 600 DPI, your
                labels will always look professional and sharp. Our color
                management system ensures accurate color reproduction, while the
                precision measurement tools (supporting both millimeters and
                inches) guarantee perfect sizing every time.
              </p>
            </section>

            {/* Workflow Efficiency */}
            <section className="info-section highlight-card">
              <h2 className="section-title-blue">
                Enhanced Workflow Efficiency
              </h2>
              <p className="section-text">
                Save time and reduce errors with our template system. Create
                reusable label templates that can be quickly adapted for
                different products or purposes. The batch processing feature
                allows you to generate hundreds or thousands of labels from
                imported data, with intelligent filtering and selection options
                to process exactly the records you need. Our search
                functionality makes it easy to locate specific data entries in
                large datasets, while the range selection feature enables
                precise control over which labels to generate.
              </p>
            </section>

            {/* Support & Training */}
            <section className="info-section">
              <h2 className="section-title-blue">
                Support & Continuous Innovation
              </h2>
              <p className="section-text">
                Archery Technocrats is committed to providing exceptional
                customer support and continuous product improvement. Our
                dedicated support team is available to assist with any questions
                or challenges you may encounter. Regular updates bring new
                features, performance enhancements, and security improvements to
                ensure your experience remains at the forefront of label
                printing technology.
              </p>
              <p className="section-text">
                We actively listen to customer feedback and incorporate user
                suggestions into our development roadmap. This customer-centric
                approach has made ATPL Cloud Printing the preferred choice for
                businesses of all sizes, from small startups to large
                enterprises.
              </p>
            </section>

            {/* Company Mission */}
            <section className="info-section mission-card">
              <h2 className="section-title-pink">
                Our Mission: Target Perfection
              </h2>
              <p className="section-text">
                At Archery Technocrats, we don't just aim for excellence—we
                target perfection. This philosophy drives every aspect of ATPL
                Cloud Printing, from the precision of our measurement tools to
                the clarity of our user interface. We believe that great
                software should empower users to achieve their goals efficiently
                while maintaining the highest standards of quality and
                reliability.
              </p>
              <p className="section-text">
                Our vision is to make professional label design accessible to
                everyone, eliminating the complexity traditionally associated
                with label creation software. By combining powerful features
                with intuitive design, we enable businesses to create perfect
                labels that enhance their brand image and streamline their
                operations. ATPL Cloud Printing represents our commitment to
                innovation, quality, and customer success.
              </p>
            </section>

            {/* Contact Information */}
            <section className="info-section contact-card">
              <h2 className="section-title-blue">Get In Touch</h2>
              <p className="section-text">
                For more information about ATPL Cloud Printing or to discuss how
                our solution can benefit your organization, please visit our
                website or contact our sales team. We offer personalized
                demonstrations and can help you determine the best configuration
                for your specific needs.
              </p>
              <div className="website-link">
                <span className="website-icon">🌐</span>
                <a href="https://www.atplgroup.com" className="website-text">
                  www.atplgroup.com
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="detailed-info-footer">
          <button onClick={onBack} className="btn btn-secondary">
            <ArrowLeft size={18} />
            <span>Back to About</span>
          </button>
          <button onClick={onClose} className="btn btn-primary">
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedInfo;
