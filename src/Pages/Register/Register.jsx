import React, { useState, useEffect } from 'react';
import './Register.css';
import { supabase } from '../../supabaseClient.js';
import { Link } from 'react-router-dom';
import { logo_amazonia } from '../../../config.js';

const Register = () => {
  // Estados para el formulario
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'reporter'
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estados de validación
  const [validation, setValidation] = useState({
    fullname: { isValid: false, showError: false, showSuccess: false },
    email: { isValid: false, showError: false, showSuccess: false },
    password: { isValid: false, showError: false },
    confirmPassword: { isValid: false, showError: false, showSuccess: false }
  });

  const [passwordStrength, setPasswordStrength] = useState({ level: 0, label: 'Débil', className: '' });


  // registro de usuarios

  const handleRegister = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      alert(error.message)
      return
    }


    //registrar usuario en la base de datos
    const user = data.user
    if (user) {
      const { error: insertError } = await supabase
        .from('Usuario')
        .insert([{nombre_completo: formData.fullname, rol: formData.role, correo: formData.email,
          id_user_autenticacion: user.id
        }])
      if (insertError) alert(insertError.message)
      else alert('Usuario registrado correctamente 🎉')
    }
  }


  // Función para verificar la fortaleza de la contraseña
  const checkPasswordStrength = (password) => {
    let strength = 0;
    let label = 'Muy débil';
    let className = 'weak';

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    switch (strength) {
      case 0:
      case 1:
        label = 'Muy débil';
        className = 'weak';
        break;
      case 2:
        label = 'Débil';
        className = 'weak';
        break;
      case 3:
        label = 'Regular';
        className = 'fair';
        break;
      case 4:
        label = 'Buena';
        className = 'good';
        break;
      case 5:
        label = 'Muy fuerte';
        className = 'strong';
        break;
      default:
        label = 'Débil';
        className = 'weak';
    }

    return { strength, label, className };
  };

  // Validación del nombre completo
  const validateFullName = (value) => {
    const isValid = value.trim().length >= 2;
    setValidation(prev => ({
      ...prev,
      fullname: {
        isValid,
        showError: value.trim() !== '' && !isValid,
        showSuccess: value.trim() !== '' && isValid
      }
    }));
    return isValid;
  };

  // Validación del email
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setValidation(prev => ({
      ...prev,
      email: {
        isValid,
        showError: value.trim() !== '' && !isValid,
        showSuccess: value.trim() !== '' && isValid
      }
    }));
    return isValid;
  };

  // Validación de la contraseña
  const validatePassword = (value) => {
    const isValid = value.length >= 8;
    const strength = checkPasswordStrength(value);

    setPasswordStrength(strength);

    setValidation(prev => ({
      ...prev,
      password: {
        isValid,
        showError: value.trim() !== '' && !isValid
      }
    }));

    // Revalidar confirmación de contraseña si existe
    if (formData.confirmPassword) {
      validateConfirmPassword(formData.confirmPassword, value);
    }

    return isValid;
  };

  // Validación de confirmación de contraseña
  const validateConfirmPassword = (confirmValue, passwordValue = formData.password) => {
    const isValid = confirmValue === passwordValue && confirmValue.length > 0;
    setValidation(prev => ({
      ...prev,
      confirmPassword: {
        isValid,
        showError: confirmValue.trim() !== '' && !isValid,
        showSuccess: confirmValue.trim() !== '' && isValid
      }
    }));
    return isValid;
  };

  // Función para verificar si todos los campos son válidos
  const isFormValid = () => {
    return validation.fullname.isValid &&
      validation.email.isValid &&
      validation.password.isValid &&
      validation.confirmPassword.isValid &&
      termsAccepted;
  };

  // Manejo de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validar según el campo
    switch (name) {
      case 'fullname':
        validateFullName(value);
        break;
      case 'email':
        validateEmail(value);
        break;
      case 'password':
        validatePassword(value);
        break;
      case 'confirmPassword':
        validateConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  // Manejo del cambio de rol
  const handleRoleChange = (e) => {
    setFormData(prev => ({ ...prev, role: e.target.value }));
  };

  // Manejo del checkbox de términos
  const handleTermsChange = (e) => {
    setTermsAccepted(e.target.checked);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ocultar mensajes previos
    setMessage({ type: '', text: '' });

    // Validar todos los campos antes de enviar
    const allValid = isFormValid();

    if (!allValid) {
      setMessage({
        type: 'error',
        text: 'Por favor, completa todos los campos correctamente.'
      });
      return;
    }

    // Mostrar estado de carga
    setIsLoading(true);

    // Simular proceso de registro (reemplazar con tu lógica de registro)
    setTimeout(() => {
      setIsLoading(false);

      setMessage({
        type: 'success',
        text: '¡Cuenta creada exitosamente! Revisa tu email para verificar tu cuenta.'
      });

      // Resetear el formulario
      setFormData({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'reporter'
      });
      setTermsAccepted(false);
      setValidation({
        fullname: { isValid: false, showError: false, showSuccess: false },
        email: { isValid: false, showError: false, showSuccess: false },
        password: { isValid: false, showError: false },
        confirmPassword: { isValid: false, showError: false, showSuccess: false }
      });
      setPasswordStrength({ level: 0, label: 'Débil', className: '' });
    }, 2500);
  };


  // Función para manejar el enlace de login
  const handleLoginLink = (e) => {
    e.preventDefault();
   
    navigate('/login');
  };

  // Función para manejar los enlaces de términos y privacidad
  const handleTermsLink = (e) => {
    e.preventDefault();

  };

  // Auto-focus en el campo de nombre al cargar el componente
  useEffect(() => {
    const fullnameInput = document.getElementById('register-fullname');
    if (fullnameInput) {
      fullnameInput.focus();
    }
  }, []);

  return (
    <div className="">


      {/* Contenedor principal del registro */}
      <div className="register-container">


        {/* Lado derecho - Formulario */}
        <div className="register-form-side">
          {/* Logo */}
          <div className="register-logo-section">
            <Link to="/" className="register-logo">
              <span>Amazonnews</span>
            </Link>
          </div>

          {/* Encabezado del formulario */}
          <div className="register-form-header">
            <h2 className="register-form-title">Crear Cuenta</h2>
            <p className="register-form-subtitle">Únete a nuestra comunidad de periodistas</p>
          </div>

          {/* Mensajes de éxito/error */}
          {message.type && (
            <div className={`register-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Formulario de registro */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Nombre completo */}
            <div className="register-form-group">
              <label htmlFor="register-fullname" className="register-form-label">
                Nombre Completo
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">👤</span>
                <input
                  type="text"
                  id="register-fullname"
                  name="fullname"
                  className={`register-form-input ${validation.fullname.showSuccess ? 'valid' : ''} ${validation.fullname.showError ? 'invalid' : ''}`}
                  placeholder="Tu nombre completo"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                />
              </div>
              {validation.fullname.showError && (
                <div className="register-field-error">
                  Por favor, ingresa tu nombre completo
                </div>
              )}
              {validation.fullname.showSuccess && (
                <div className="register-field-success">
                  ✓ Nombre válido
                </div>
              )}
            </div>

            {/* Email */}
            <div className="register-form-group">
              <label htmlFor="register-email" className="register-form-label">
                Correo Electrónico
              </label>
              <div className="register-input-wrapper">
                <span className="register-input-icon">📧</span>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  className={`register-form-input ${validation.email.showSuccess ? 'valid' : ''} ${validation.email.showError ? 'invalid' : ''}`}
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
              </div>
              {validation.email.showError && (
                <div className="register-field-error">
                  Por favor, ingresa un email válido
                </div>
              )}
              {validation.email.showSuccess && (
                <div className="register-field-success">
                  ✓ Email válido
                </div>
              )}
            </div>

            {/* Fila de contraseñas */}
            <div className="register-form-row">
              {/* Contraseña */}
              <div className="register-form-group">
                <label htmlFor="register-password" className="register-form-label">
                  Contraseña
                </label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon">🔒</span>
                  <input
                    type='password'
                    id="register-password"
                    name="password"
                    className={`register-form-input ${validation.password.isValid ? 'valid' : ''} ${validation.password.showError ? 'invalid' : ''}`}
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                  />

                </div>
                {formData.password && (
                  <div className="register-password-strength">
                    <div className="register-strength-label">
                      Fortaleza de la contraseña: <span>{passwordStrength.label}</span>
                    </div>
                    <div className="register-strength-bar">
                      <div className={`register-strength-fill ${passwordStrength.className}`}></div>
                    </div>
                  </div>
                )}
                {validation.password.showError && (
                  <div className="register-field-error">
                    La contraseña debe tener al menos 8 caracteres
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="register-form-group">
                <label htmlFor="register-confirm-password" className="register-form-label">
                  Confirmar Contraseña
                </label>
                <div className="register-input-wrapper">
                  <span className="register-input-icon">🔒</span>
                  <input
                    type={'password'}
                    id="register-confirm-password"
                    name="confirmPassword"
                    className={`register-form-input ${validation.confirmPassword.showSuccess ? 'valid' : ''} ${validation.confirmPassword.showError ? 'invalid' : ''}`}
                    placeholder="Confirma tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
                {validation.confirmPassword.showError && (
                  <div className="register-field-error">
                    Las contraseñas no coinciden
                  </div>
                )}
                {validation.confirmPassword.showSuccess && (
                  <div className="register-field-success">
                    ✓ Las contraseñas coinciden
                  </div>
                )}
              </div>
            </div>

            {/* Selección de rol */}
            <div className="register-form-group">
              <label className="register-form-label">Selecciona tu rol</label>
              <div className="register-role-selection">
                <div className="register-role-option">
                  <input
                    type="radio"
                    id="register-reporter"
                    name="role"
                    value="reporter"
                    className="register-role-input"
                    checked={formData.role === 'reporter'}
                    onChange={handleRoleChange}
                  />
                  <label htmlFor="register-reporter" className="register-role-label">
                    Reportero
                  </label>
                </div>
                <div className="register-role-option">
                  <input
                    type="radio"
                    id="register-editor"
                    name="role"
                    value="editor"
                    className="register-role-input"
                    checked={formData.role === 'editor'}
                    onChange={handleRoleChange}
                  />
                  <label htmlFor="register-editor" className="register-role-label">
                    Editor
                  </label>
                </div>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className="register-terms-wrapper">
              <input
                type="checkbox"
                id="register-terms"
                name="terms"
                className="register-terms-checkbox"
                checked={termsAccepted}
                onChange={handleTermsChange}
                required
              />
              <label htmlFor="register-terms" className="register-terms-label">
                Acepto los{' '}
                <a href="#" onClick={handleTermsLink} target="_blank" rel="noopener noreferrer">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" onClick={handleTermsLink} target="_blank" rel="noopener noreferrer">
                  política de privacidad
                </a>
              </label>
            </div>

            {/* Botón de registro */}
            <button
              type="submit"
              className={`register-button ${isLoading ? 'loading' : ''}`}
              disabled={!isFormValid() || isLoading}
              onClick={handleRegister}
            >
              <div className="register-button-content">
                <div className={`register-loading-spinner ${isLoading ? '' : 'hidden'}`}></div>
                <span>{isLoading ? 'Creando cuenta...' : 'Crear cuenta'}</span>
              </div>
            </button>
          </form>

          {/* Divisor */}
          <div className="register-divider">
            <span>o</span>
          </div>

          {/* Enlace de login */}
          <div className="register-login-link">
            <span>¿Ya tienes cuenta? </span>
            <Link to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
