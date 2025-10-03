// Newsletter form handler
export function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  const errorMessage = document.getElementById('newsletter-error-message');
  const successMessage = document.getElementById('newsletter-success-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide any existing messages
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Get form data
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.newsletter-button-text');
    const loader = submitButton.querySelector('.newsletter-loader');

    // Show loading state
    submitButton.disabled = true;
    buttonText.textContent = 'Signing up...';
    loader.style.display = 'block';

    try {
      // Submit to Brevo
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        mode: 'no-cors', // Brevo forms don't support CORS, so we use no-cors mode
      });

      // With no-cors mode, we can't read the response, but if no error is thrown,
      // the submission was successful
      // Fade out the form
      form.style.opacity = '0';
      form.style.transition = 'opacity 0.3s ease';
      
      setTimeout(() => {
        // Hide the form
        form.style.display = 'none';
        
        // Show success message with fade-in
        successMessage.style.display = 'block';
        successMessage.style.opacity = '0';
        
        setTimeout(() => {
          successMessage.style.opacity = '1';
          successMessage.style.transition = 'opacity 0.3s ease';
        }, 10);
        
        // Optional: Reset form for future use
        form.reset();
      }, 300);
    } catch (error) {
      console.error('Newsletter signup error:', error);
      
      // Show error message
      errorMessage.style.display = 'block';
      
      // Reset button state
      submitButton.disabled = false;
      buttonText.textContent = 'Sign up';
      loader.style.display = 'none';
    }
  });
}
