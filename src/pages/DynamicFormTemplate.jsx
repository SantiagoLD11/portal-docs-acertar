import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import { getCountryByIdClient, getToken, updateAttachs, getUserById, updateExamenById } from "../services/api";
import { useParams } from "react-router-dom";
import { Button, message, Card, Typography, Space, Divider, Alert, Checkbox, Form } from "antd";
import { FileTextOutlined, CheckCircleOutlined, LoadingOutlined, UserOutlined, IdcardOutlined, CalendarOutlined, BankOutlined } from "@ant-design/icons";
import Swal from 'sweetalert2';
import "../styles/form.css";

const { Title, Text, Paragraph } = Typography;

const ConsentForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [userData, setUserData] = useState({
        nombre: '',
        cedula: '',
        fechaNacimiento: '',
        empresa: '',
        autorizado: false
    });
    const [formData, setFormData] = useState({
        fechaNacimiento: '',
        firma: ''
    });
    const [signatureData, setSignatureData] = useState(null);
    const [consentSent, setConsentSent] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const { id } = useParams();

    // Función para obtener datos del usuario desde la API
    const fetchUserData = async (clientId) => {
        try {
            // Aquí deberías implementar la llamada a tu API para obtener los datos del usuario
            const userData = await getUserById(clientId);

            if (userData) {
                setUserData(userData);
                console.log("Datos del usuario cargados:", userData);
            } else {
                message.error("No se encontraron datos del usuario");
            }
        } catch (error) {
            console.error("Error obteniendo datos del usuario:", error);
            message.error("Error al cargar los datos del usuario");
        }
    };

    // Función para manejar el cambio del checkbox de consentimiento
    const handleConsentChange = (e) => {
        setConsentAccepted(e.target.checked);
    };

    // Función para manejar cambios en los campos del formulario
    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Función para obtener coordenadas correctas
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // Función para iniciar el dibujo
    const startDrawing = (e) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    };

    // Función para dibujar
    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    // Función para detener el dibujo
    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Función para limpiar la firma
    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData(null);
        setFormData(prev => ({
            ...prev,
            firma: ''
        }));
    };

    // Función para guardar la firma como base64
    const saveSignature = () => {
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL('image/png');
        setSignatureData(dataURL);
        setFormData(prev => ({
            ...prev,
            firma: dataURL
        }));
    };

    // Función para verificar si hay firma en el canvas
    const hasSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return imageData.data.some(channel => channel !== 0);
    };

    // Función para enviar el consentimiento
    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // Validar que todos los campos estén completos
            if (!consentAccepted) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Consentimiento Requerido',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">Debe aceptar el consentimiento para continuar.</p>
                            <div class="bg-yellow-50 p-3 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    Por favor lea cuidadosamente el texto del consentimiento y marque la casilla de aceptación.
                                </p>
                        </div>
                    </div>
                `,
                    confirmButtonColor: '#1FB9B9',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            // Validar campos del formulario
            if (!formData.fechaNacimiento || !signatureData) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Requeridos',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">Debe completar todos los campos obligatorios.</p>
                            <div class="bg-yellow-50 p-3 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    Por favor complete la fecha de nacimiento y firme digitalmente en el panel de firma.
                                </p>
                        </div>
                    </div>
                `,
                    confirmButtonColor: '#1FB9B9',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            // Mostrar confirmación
            const result = await Swal.fire({
                icon: 'question',
                title: 'Confirmar Consentimiento',
                html: `
                <div class="text-left">
                        <p class="mb-3">¿Está seguro de que desea enviar su consentimiento?</p>
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-blue-800">
                                <strong>Datos del usuario:</strong><br/>
                                • Nombre: ${userData.nombre}<br/>
                                • Cédula: ${userData.cedula}<br/>
                                • Fecha de Nacimiento: ${formData.fechaNacimiento}<br/>
                                • Empresa: ${userData.empresa}<br/>
                                • Fecha de Firma: ${new Date().toLocaleDateString('es-CO')}
                            </p>
                    </div>
                </div>
            `,
                showCancelButton: true,
                confirmButtonColor: '#1FB9B9',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Sí, Enviar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            });

            if (!result.isConfirmed) {
                return;
            }

            // Mostrar alerta de carga
            Swal.fire({
                title: 'Enviando Consentimiento...',
                html: `
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1FB9B9]"></div>
                    </div>
                        <p class="text-sm text-gray-600">Procesando su consentimiento...</p>
                </div>
            `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Crear objeto de consentimiento
            const consentData = {
                userId: id,
                userData: userData,
                formData: formData,
                signatureData: signatureData,
                consentAccepted: true,
                timestamp: new Date().toISOString(),
                signatureDate: new Date().toISOString(),
                ipAddress: 'N/A' // Podrías obtener la IP real aquí
            };

            console.log("Consentimiento a enviar:", consentData);

            // Enviar a la API (aquí debes implementar tu endpoint específico)
            await updateExamenById(id, consentData);

            // Marcar consentimiento como enviado
            setConsentSent(true);

            // Mostrar éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Consentimiento Enviado!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-3">Su consentimiento ha sido registrado exitosamente.</p>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-sm text-green-800">
                                <strong>Consentimiento procesado para:</strong><br/>
                                ${userData.nombre} - ${userData.empresa}
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#1FB9B9',
                confirmButtonText: 'Finalizar',
                showClass: {
                    popup: 'animate__animated animate__zoomIn'
                },
                hideClass: {
                    popup: 'animate__animated animate__zoomOut'
                }
            });

        } catch (error) {
            console.error("Error enviando consentimiento:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al Enviar Consentimiento',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Ha ocurrido un error al enviar el consentimiento.</p>
                        <div class="bg-red-50 p-3 rounded-lg">
                            <p class="text-sm text-red-800"><strong>Detalles del error:</strong></p>
                            <p class="text-xs text-red-700 mt-1">${error.message || 'Error de conexión'}</p>
                        </div>
                        <p class="text-sm text-gray-600 mt-3">Por favor intente nuevamente o contacte al administrador.</p>
                    </div>
                `,
                confirmButtonColor: '#1FB9B9',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Configurar el canvas de firma
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Configurar el canvas para ser responsivo
            const resizeCanvas = () => {
                const container = canvas.parentElement;
                const containerWidth = container.clientWidth - 32; // padding
                const aspectRatio = 600 / 200; // width / height
                const newWidth = Math.min(containerWidth, 600);
                const newHeight = newWidth / aspectRatio;

                canvas.style.width = newWidth + 'px';
                canvas.style.height = newHeight + 'px';
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    // Inicializar token y cargar datos del usuario
    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);
                const token = await getToken("acertar.portal", "acertar.portal");
                if (token) {
                    sessionStorage.setItem("token", token);
                } else {
                    message.error("Error al obtener token de autenticación");
                }

                // Cargar datos del usuario
                await fetchUserData(id);

            } catch (error) {
                console.error("Error inicializando:", error);
                message.error("Error al inicializar el portal");
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="loading-spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando formulario de consentimiento...</p>
                        <p className="text-gray-500 text-sm mt-2">Obteniendo datos del usuario...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Pantalla cuando el usuario ya está autorizado
    if (userData.autorizado) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-4">
                        {/* Icono de información */}
                        <div className="bg-blue-100 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        {/* Título principal */}
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">
                            Ya Autorizado
                        </h1>

                        {/* Mensaje informativo */}
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                            <p className="text-lg text-blue-800 mb-4">
                                <strong>Este usuario ya ha completado el proceso de autorización.</strong>
                            </p>
                            <p className="text-blue-700">
                                El formulario de consentimiento ya ha sido enviado y procesado anteriormente.
                                No es posible volver a llenar el formulario.
                            </p>
                        </div>

                        {/* Información del usuario */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-gray-800 font-semibold">Datos del Usuario</span>
                            </div>
                            <div className="text-left space-y-2">
                                <p className="text-gray-700"><strong>Nombre:</strong> {userData.nombre}</p>
                                <p className="text-gray-700"><strong>Cédula:</strong> {userData.cedula}</p>
                                <p className="text-gray-700"><strong>Empresa:</strong> {userData.empresa}</p>
                            </div>
                        </div>

                        {/* Botón de acción */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.close()}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                Cerrar Ventana
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-gray-500 text-sm">
                                Portal de Consentimiento - Sistema Seguro
                            </p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // Pantalla de confirmación después de enviar consentimiento
    if (consentSent) {
        return (
            <Layout>
                <div className="bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-4">
                        {/* Icono de éxito */}
                        <div className="bg-green-100 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Título principal */}
                        <h1 className="text-3xl font-bold text-green-600 mb-4">
                            ¡Consentimiento Registrado Exitosamente!
                        </h1>

                        {/* Mensaje de agradecimiento */}
                        <div className="bg-green-50 rounded-lg p-6 mb-6">
                            <p className="text-lg text-green-800 mb-4">
                                <strong>Gracias por completar el proceso de consentimiento.</strong>
                            </p>
                            <p className="text-green-700">
                                Su consentimiento ha sido registrado correctamente.
                                Nuestro equipo procesará la información y se pondrá en contacto
                                con usted si es necesario.
                            </p>
                        </div>

                        {/* Información adicional */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-blue-800 font-semibold">Información Importante</span>
                            </div>
                            <p className="text-blue-700 text-sm">
                                Recibirá una confirmación por correo electrónico en las próximas 24 horas.
                                Si tiene alguna pregunta, no dude en contactarnos.
                            </p>
                        </div>

                        {/* Botón de acción */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.close()}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                Cerrar Ventana
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-gray-500 text-sm">
                                Portal de Consentimiento - Sistema Seguro
                            </p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B]">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
                    {/* Encabezado */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden mt-2 sm:mt-4">
                        <div className="absolute top-0 right-0 opacity-20 hidden sm:block">
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 0C44.8 0 0 44.8 0 100C0 155.2 44.8 200 100 200C155.2 200 200 155.2 200 100C200 44.8 155.2 0 100 0Z" fill="#1FB9B9" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
                                <div className="bg-[#1FB9B9] p-2 sm:p-3 rounded-full mr-3 sm:mr-4 mb-2 sm:mb-0">
                                    <FileTextOutlined className="text-white text-xl sm:text-2xl" />
                                </div>
                                <div className="flex-1">
                                    <Title level={2} className="text-[#1FB9B9] mb-0 text-lg sm:text-2xl">
                                        Autorización Poligráfica
                                    </Title>
                                    <Text className="text-gray-600 text-sm sm:text-base">
                                        Consentimiento para prueba poligráfica y evaluación psicológica
                                    </Text>
                                </div>
                            </div>
                            <Alert
                                message="Información Importante"
                                description="Por favor lea cuidadosamente la autorización para la prueba poligráfica. Esta autorización es voluntaria y puede ser revocada en cualquier momento. Confirme sus datos antes de proceder."
                                type="info"
                                showIcon
                                className="mb-4"
                            />
                        </div>
                    </div>

                    {/* Datos del Usuario */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-4 flex items-center text-base sm:text-lg">
                            <UserOutlined className="mr-2" />
                            Datos del Usuario
                        </Title>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                                <UserOutlined className="text-blue-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-blue-800 font-medium block">Nombre Completo</Text>
                                    <Text className="text-blue-600">{userData.nombre}</Text>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-green-50 rounded-lg">
                                <IdcardOutlined className="text-green-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-green-800 font-medium block">Cédula de Ciudadanía</Text>
                                    <Text className="text-green-600">{userData.cedula}</Text>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                                <CalendarOutlined className="text-purple-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-purple-800 font-medium block">Fecha de Nacimiento</Text>
                                    <Text className="text-purple-600">{userData.fechaNacimiento}</Text>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                                <BankOutlined className="text-orange-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-orange-800 font-medium block">Empresa</Text>
                                    <Text className="text-orange-600">{userData.empresa}</Text>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Texto del Consentimiento */}
                    <div className="bg-white rounded-xl shadow-lg px-1 py-2 sm:p-6 mb-4 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-2 sm:mb-4 flex items-center text-xs sm:text-lg">
                            <FileTextOutlined className="mr-1" />
                            Autorización para Prueba Poligráfica
                        </Title>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg py-2 overflow-y-auto border border-gray-200">
                            <div className="text-center mb-1 sm:mb-6">
                                <h2 className="text-xs sm:text-xl font-bold text-gray-800 mb-0.5">AUTORIZACIÓN PARA PRUEBA POLIGRÁFICA</h2>
                                <div className="w-6 sm:w-16 h-0.5 bg-[#1FB9B9] mx-auto rounded"></div>
                            </div>

                            <div className="space-y-1 sm:space-y-4 text-gray-700 leading-tight text-xs sm:text-base">
                                <p className="text-justify">
                                    Yo, <strong className="text-[#1FB9B9]">{userData.nombre}</strong>, identificado con la cédula número <strong className="text-[#1FB9B9]">{userData.cedula}</strong> con fecha de nacimiento del <strong className="text-[#1FB9B9]">{formData.fechaNacimiento || '____'}</strong> de manera voluntaria y libre de coacción, coerción, amenazas, promesas de recompensa o inmunidad, accedo a someterme a una entrevista y a una prueba poligráfica o evaluación psicológica de estrés o a cualquier técnica para detectar decepción, con relación a la veracidad de mis declaraciones vinculadas a: <span className="text-gray-500 italic"> {userData.tipoExamen}</span>.
                                </p>

                                <p className="text-justify font-medium">
                                    Por medio del presente documento declaro que:
                                </p>

                                <div className="space-y-0.5 sm:space-y-3 ml-0.5 sm:ml-4">
                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">Se me ha explicado la naturaleza y el procedimiento de esta prueba.</p>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">A mi leal saber y entender, estoy en buenas condiciones de salud y no me están haciendo ningún tratamiento por enfermedad mental o emocional.</p>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">Se me ha informado que tengo todo el derecho de rehusarme a ser sometido a ella, y que puedo parar de hablar y dar por terminada la prueba unilateralmente en cualquier momento sin perjuicio alguno. Se me ha dicho de otra parte, que de acuerdo con el Artículo 33 de la Constitución Política "nadie podrá ser obligado a declarar en contra de sí mismo o contra su cónyuge, compañero permanente o parientes dentro del cuarto grado de consanguinidad, segundo de afinidad o primero de afinidad".</p>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">Autorizo al examinador para que grabe mis declaraciones y para que utilice cualquier mecanismo auditivo o de grabación que se use en la actualidad con este tipo de pruebas.</p>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">Exonero, absuelvo y libero de toda responsabilidad derivada de cualquier asunto, acto o caso que pueda surgir de la anterior entrevista o prueba, al examinador, el monitor y el testigo cuyos nombres aparecen al final de este documento, al igual que a los clientes, agentes, compañía entrevistadores y empleados del examinador y a cualquiera que esté actuando en su nombre, incluyendo, pero sin limitarse, a los resultados u opiniones de allí derivadas.</p>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-[#1FB9B9] font-bold mr-0.5 sm:mr-3 mt-0 text-xs sm:text-sm">•</span>
                                        <p className="text-justify text-xs sm:text-sm">Estoy dispuesto libremente a permitir que se me haga la entrevista y la prueba de verificación de la verdad, sin promesa de recompensa, sin sentirme obligado, amenazado o coaccionado.</p>
                                    </div>

                                </div>
                                <p className="text-justify mt-1 sm:mt-4 text-xs sm:text-sm">
                                    De la misma manera, por medio del presente documento autorizo y estoy de acuerdo en que se revelen verbalmente y por escrito los resultados y conclusiones de la entrevista y de la prueba, incluyendo, pero sin limitarse a las conversaciones, comentarios, confesiones o declaraciones hechas por mí durante la entrevista y la prueba a: <strong className="text-[#1FB9B9]">{userData.empresa}</strong>.
                                </p>

                                <p className="text-justify mt-1 sm:mt-4 text-xs sm:text-sm">
                                    Conozco que, de acuerdo con la legislación nacional, en particular con la Constitución Política y la Ley 1581 de 2012, puedo ejercer ante <strong className="text-[#1FB9B9]">{userData.empresa}</strong> mis derechos de conocer, actualizar y rectificar mis datos personales, solicitar prueba de mi autorización, presentar quejas ante la Superintendencia de Industria y Comercio, solicitar la supresión del dato, así como acceder en forma gratuita a los datos personales que hayan sido objeto de tratamiento por medio de los canales establecidos en su Política de Privacidad; y que el examinador, al actuar en nombre de <strong className="text-[#1FB9B9]">{userData.empresa}</strong>, no está autorizado a entregar la información recopilada y/o resultante de esta prueba a ninguna persona, incluyendo el titular de la información.
                                </p>

                                {signatureData && (
                                    <div className="mt-2 sm:mt-6 space-y-0.5 text-xs sm:text-sm text-gray-600">
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-0.5 sm:gap-0">
                                            <div>
                                                <strong>FIRMA AUTORIZANDO:</strong> Firma Digital (Base64)
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-0.5 sm:gap-0">
                                            <div>
                                                <strong>FECHA:</strong> {new Date().toLocaleDateString('es-CO')}
                                            </div>
                                            <div>
                                                <strong>Lugar:</strong> Colombia
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sección de Autorización */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-4 flex items-center text-base sm:text-lg">
                            <FileTextOutlined className="mr-2" />
                            Autorización
                        </Title>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Nacimiento *
                                </label>
                                <input
                                    type="date"
                                    value={formData.fechaNacimiento}
                                    onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1FB9B9] focus:border-[#1FB9B9] outline-none text-sm sm:text-base"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Firma Digital *
                            </label>
                            <div className="border-2 border-gray-300 rounded-lg p-2 sm:p-4 bg-white">
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={200}
                                    className="w-full border border-gray-200 rounded cursor-crosshair max-w-full"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        const touch = e.touches[0];
                                        const mouseEvent = new MouseEvent('mousedown', {
                                            clientX: touch.clientX,
                                            clientY: touch.clientY
                                        });
                                        startDrawing(mouseEvent);
                                    }}
                                    onTouchMove={(e) => {
                                        e.preventDefault();
                                        const touch = e.touches[0];
                                        const mouseEvent = new MouseEvent('mousemove', {
                                            clientX: touch.clientX,
                                            clientY: touch.clientY
                                        });
                                        draw(mouseEvent);
                                    }}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        stopDrawing();
                                    }}
                                    style={{
                                        touchAction: 'none'
                                    }}
                                />
                                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={clearSignature}
                                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors w-full sm:w-auto"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveSignature}
                                            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#1FB9B9] text-white rounded hover:bg-[#0E8B8B] transition-colors w-full sm:w-auto"
                                        >
                                            Guardar Firma
                                        </button>
                                    </div>
                                    {signatureData && (
                                        <div className="flex items-center text-green-600 text-xs sm:text-sm">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium">Firma Guardada</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Use su mouse o dedo para dibujar su firma en el área de arriba, luego haga clic en "Guardar Firma"
                            </p>
                        </div>
                    </div>

                    {/* Checkbox de Aceptación */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                checked={consentAccepted}
                                onChange={handleConsentChange}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <Text className="text-gray-800 text-sm sm:text-base">
                                    <strong>Declaro que he leído, entendido y acepto</strong> la autorización para la prueba poligráfica.
                                    Autorizo voluntariamente a someterme a una entrevista y prueba poligráfica, conociendo mis derechos
                                    y las condiciones establecidas en el documento anterior. Confirmo que mi consentimiento es libre,
                                    previo, expreso e informado conforme a la Ley 1581 de 2012.
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Botón de envío */}
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                        <div className="text-center">
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={!consentAccepted}
                                className="bg-[#1FB9B9] hover:bg-[#0E8B8B] border-[#1FB9B9] hover:border-[#0E8B8B] px-4 sm:px-8 py-2 sm:py-3 h-auto text-sm sm:text-lg font-semibold w-full sm:w-auto"
                            >
                                {submitting ? (
                                    <>
                                        <LoadingOutlined className="mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Enviando Consentimiento...</span>
                                        <span className="sm:hidden">Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleOutlined className="mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Enviar Consentimiento</span>
                                        <span className="sm:hidden">Enviar</span>
                                    </>
                                )}
                            </Button>
                            <div className="mt-3 sm:mt-4">
                                <Text className={`text-xs sm:text-sm ${consentAccepted ? "text-green-600" : "text-orange-600"}`}>
                                    {consentAccepted
                                        ? "✅ Consentimiento listo para enviar"
                                        : "⚠️ Debe aceptar el consentimiento para continuar"
                                    }
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ConsentForm;
