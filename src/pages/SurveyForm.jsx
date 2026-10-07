import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getToken, getUserById, updateExamenById, updateExamenEncuestaById } from "../services/api";
import { useParams } from "react-router-dom";
import { Button, message, Card, Typography, Space, Divider, Alert, Form, Input, Rate, DatePicker } from "antd";
import { FileTextOutlined, CheckCircleOutlined, LoadingOutlined, UserOutlined, IdcardOutlined, CalendarOutlined, BankOutlined, StarOutlined } from "@ant-design/icons";
import Swal from 'sweetalert2';
import "../styles/form.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SurveyForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userData, setUserData] = useState({
        nombre: '',
        cedula: '',
        fechaNacimiento: '',
        empresa: '',
        autorizado: false
    });
    const [formData, setFormData] = useState({
        fecha: new Date().toLocaleDateString('es-CO'),
        pregunta1: null,
        pregunta2: null,
        pregunta3: null,
        pregunta4: null,
        pregunta5: ''
    });
    const [surveySent, setSurveySent] = useState(false);
    const { id } = useParams();

    // Función para obtener datos del usuario desde la API
    const fetchUserData = async (clientId) => {
        try {
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

    // Función para manejar cambios en los campos del formulario
    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Función para enviar la encuesta
    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // Validar que todas las preguntas estén respondidas
            if (!formData.pregunta1 || !formData.pregunta2 || !formData.pregunta3 || !formData.pregunta4) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Requeridos',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">Debe responder todas las preguntas de calificación (1-5).</p>
                            <div class="bg-yellow-50 p-3 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    Por favor complete todas las preguntas de calificación antes de enviar la encuesta.
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
                title: 'Confirmar Encuesta',
                html: `
                <div class="text-left">
                        <p class="mb-3">¿Está seguro de que desea enviar su encuesta de servicio?</p>
                    <div class="bg-blue-50 p-3 rounded-lg">
                        <p class="text-sm text-blue-800">
                                <strong>Datos del usuario:</strong><br/>
                                • Nombre: ${userData.nombre}<br/>
                                • Cédula: ${userData.cedula}<br/>
                                • Empresa: ${userData.empresa}<br/>
                                • Fecha: ${formData.fecha}
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
                title: 'Enviando Encuesta...',
                html: `
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1FB9B9]"></div>
                    </div>
                        <p class="text-sm text-gray-600">Procesando su encuesta...</p>
                </div>
            `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Crear objeto de encuesta con IDs de preguntas
            const surveyData = {
                userId: id,
                userData: userData,
                surveyType: 'service_survey',
                timestamp: new Date().toISOString(),
                surveyDate: new Date().toISOString(),
                ipAddress: 'N/A',
                respuestas: [
                    {
                        id: 73054772,
                        respuesta: formData.pregunta1
                    },
                    {
                        id: 73054773,
                        respuesta: formData.pregunta2
                    },
                    {
                        id: 73054774,
                        respuesta: formData.pregunta3
                    },
                    {
                        id: 73054775,
                        respuesta: formData.pregunta4
                    },
                    {
                        id: 73054776,
                        respuesta: formData.pregunta5
                    }
                ]
            };

            console.log("Encuesta a enviar:", surveyData);

            // Enviar a la API
            await updateExamenEncuestaById(id, surveyData);

            // Marcar encuesta como enviada
            setSurveySent(true);

            // Mostrar éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Encuesta Enviada!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-3">Su encuesta ha sido registrada exitosamente.</p>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-sm text-green-800">
                                <strong>Encuesta procesada para:</strong><br/>
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
            console.error("Error enviando encuesta:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al Enviar Encuesta',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Ha ocurrido un error al enviar la encuesta.</p>
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
                        <p className="text-gray-600">Cargando encuesta de servicio...</p>
                        <p className="text-gray-500 text-sm mt-2">Obteniendo datos del usuario...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Pantalla de confirmación después de enviar encuesta
    if (surveySent) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-4">
                        {/* Icono de éxito */}
                        <div className="bg-green-100 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Título principal */}
                        <h1 className="text-3xl font-bold text-green-600 mb-4">
                            ¡Encuesta Registrada Exitosamente!
                        </h1>

                        {/* Mensaje de agradecimiento */}
                        <div className="bg-green-50 rounded-lg p-6 mb-6">
                            <p className="text-lg text-green-800 mb-4">
                                <strong>Gracias por completar la encuesta de servicio.</strong>
                            </p>
                            <p className="text-green-700">
                                Su opinión es muy importante para nosotros y nos ayudará a mejorar nuestros servicios.
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
                                Sus respuestas han sido registradas y serán utilizadas para mejorar nuestros servicios.
                                Si tiene alguna pregunta adicional, no dude en contactarnos.
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
                                Portal de Encuestas - Sistema Seguro
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
                    {/* Encabezado de la Encuesta */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden mt-2 sm:mt-4">
                        <div className="absolute top-0 right-0 opacity-20 hidden sm:block">
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 0C44.8 0 0 44.8 0 100C0 155.2 44.8 200 100 200C155.2 200 200 155.2 200 100C200 44.8 155.2 0 100 0Z" fill="#1FB9B9" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            {/* Título principal */}
                            <div className="text-center mb-6">
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#1FB9B9] mb-4">
                                    ENCUESTA DE SERVICIO
                                </h1>
                                <div className="w-16 h-1 bg-[#1FB9B9] mx-auto rounded"></div>
                            </div>

                            {/* Información de la encuesta */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Código:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">DE-FO-15</Text>
                                </div>
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Versión:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">1</Text>
                                </div>
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Fecha:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">{formData.fecha}</Text>
                                </div>
                            </div>

                            {/* Instrucciones */}
                            <Alert
                                message="Instrucciones"
                                description="Por favor califique su experiencia de 1 a 5 siendo 1 mala y 5 excelente. Sus respuestas nos ayudarán a mejorar nuestros servicios."
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
                            Datos del Candidato
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
                            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                                <BankOutlined className="text-orange-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-orange-800 font-medium block">Empresa</Text>
                                    <Text className="text-orange-600">{userData.empresa}</Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario de Encuesta */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-6 flex items-center text-base sm:text-lg">
                            <StarOutlined className="mr-2" />
                            Preguntas de Evaluación
                        </Title>

                        {/* Instrucciones de calificación */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#1FB9B9] p-4 mb-8 rounded-r-lg">
                            <div className="flex items-center mb-2">
                                <StarOutlined className="text-[#1FB9B9] text-xl mr-3" />
                                <Text className="text-[#1FB9B9] font-semibold text-lg">Instrucciones de Calificación</Text>
                            </div>
                            <Text className="text-gray-700 text-base leading-relaxed">
                                <strong>Por favor califique su experiencia de 1 a 5 siendo 1 mala y 5 excelente</strong>
                            </Text>
                            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span className="text-red-500 font-semibold mr-1">1</span>
                                    <span>Mala</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-orange-500 font-semibold mr-1">2</span>
                                    <span>Regular</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-yellow-500 font-semibold mr-1">3</span>
                                    <span>Buena</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-blue-500 font-semibold mr-1">4</span>
                                    <span>Muy Buena</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-green-500 font-semibold mr-1">5</span>
                                    <span>Excelente</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Pregunta 1 */}
                            <div className="border-b border-gray-200 pb-6">
                                <div className="mb-4">
                                    <Text className="text-gray-800 font-medium text-base sm:text-lg">
                                        1. ¿Cómo considera la atención del personal de recepción?
                                    </Text>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Rate
                                        value={formData.pregunta1}
                                        onChange={(value) => handleFormChange('pregunta1', value)}
                                        className="text-2xl"
                                    />
                                    <Text className="text-gray-600 text-sm">
                                        {formData.pregunta1 ? 
                                            (formData.pregunta1 === 1 ? 'Mala' :
                                             formData.pregunta1 === 2 ? 'Regular' :
                                             formData.pregunta1 === 3 ? 'Buena' :
                                             formData.pregunta1 === 4 ? 'Muy Buena' :
                                             formData.pregunta1 === 5 ? 'Excelente' : '') 
                                            : 'Sin calificar'}
                                    </Text>
                                </div>
                            </div>

                            {/* Pregunta 2 */}
                            <div className="border-b border-gray-200 pb-6">
                                <div className="mb-4">
                                    <Text className="text-gray-800 font-medium text-base sm:text-lg">
                                        2. ¿Cómo considera el trato que recibió por parte del poligrafista?
                                    </Text>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Rate
                                        value={formData.pregunta2}
                                        onChange={(value) => handleFormChange('pregunta2', value)}
                                        className="text-2xl"
                                    />
                                    <Text className="text-gray-600 text-sm">
                                        {formData.pregunta2 ? 
                                            (formData.pregunta2 === 1 ? 'Mala' :
                                             formData.pregunta2 === 2 ? 'Regular' :
                                             formData.pregunta2 === 3 ? 'Buena' :
                                             formData.pregunta2 === 4 ? 'Muy Buena' :
                                             formData.pregunta2 === 5 ? 'Excelente' : '') 
                                            : 'Sin calificar'}
                                    </Text>
                                </div>
                            </div>

                            {/* Pregunta 3 */}
                            <div className="border-b border-gray-200 pb-6">
                                <div className="mb-4">
                                    <Text className="text-gray-800 font-medium text-base sm:text-lg">
                                        3. ¿Fueron solucionadas sus dudas sobre la prueba de manera satisfactoria?
                                    </Text>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Rate
                                        value={formData.pregunta3}
                                        onChange={(value) => handleFormChange('pregunta3', value)}
                                        className="text-2xl"
                                    />
                                    <Text className="text-gray-600 text-sm">
                                        {formData.pregunta3 ? 
                                            (formData.pregunta3 === 1 ? 'Mala' :
                                             formData.pregunta3 === 2 ? 'Regular' :
                                             formData.pregunta3 === 3 ? 'Buena' :
                                             formData.pregunta3 === 4 ? 'Muy Buena' :
                                             formData.pregunta3 === 5 ? 'Excelente' : '') 
                                            : 'Sin calificar'}
                                    </Text>
                                </div>
                            </div>

                            {/* Pregunta 4 */}
                            <div className="border-b border-gray-200 pb-6">
                                <div className="mb-4">
                                    <Text className="text-gray-800 font-medium text-base sm:text-lg">
                                        4. ¿La prueba se ejecutó en el horario que se encontraba programada?
                                    </Text>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Rate
                                        value={formData.pregunta4}
                                        onChange={(value) => handleFormChange('pregunta4', value)}
                                        className="text-2xl"
                                    />
                                    <Text className="text-gray-600 text-sm">
                                        {formData.pregunta4 ? 
                                            (formData.pregunta4 === 1 ? 'Mala' :
                                             formData.pregunta4 === 2 ? 'Regular' :
                                             formData.pregunta4 === 3 ? 'Buena' :
                                             formData.pregunta4 === 4 ? 'Muy Buena' :
                                             formData.pregunta4 === 5 ? 'Excelente' : '') 
                                            : 'Sin calificar'}
                                    </Text>
                                </div>
                            </div>

                            {/* Pregunta 5 - Campo abierto */}
                            <div>
                                <div className="mb-4">
                                    <Text className="text-gray-800 font-medium text-base sm:text-lg">
                                        5. ¿Qué aspecto considera que debemos mejorar?
                                    </Text>
                                </div>
                                <TextArea
                                    value={formData.pregunta5}
                                    onChange={(e) => handleFormChange('pregunta5', e.target.value)}
                                    placeholder="Por favor, comparta sus sugerencias para mejorar nuestros servicios..."
                                    rows={4}
                                    className="w-full"
                                />
                                <Text className="text-gray-500 text-sm mt-2">
                                    Campo opcional - Sus comentarios son muy valiosos para nosotros
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
                                disabled={!formData.pregunta1 || !formData.pregunta2 || !formData.pregunta3 || !formData.pregunta4}
                                className="bg-[#1FB9B9] hover:bg-[#0E8B8B] border-[#1FB9B9] hover:border-[#0E8B8B] px-4 sm:px-8 py-2 sm:py-3 h-auto text-sm sm:text-lg font-semibold w-full sm:w-auto"
                            >
                                {submitting ? (
                                    <>
                                        <LoadingOutlined className="mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Enviando Encuesta...</span>
                                        <span className="sm:hidden">Enviando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleOutlined className="mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Enviar Encuesta</span>
                                        <span className="sm:hidden">Enviar</span>
                                    </>
                                )}
                            </Button>
                            <div className="mt-3 sm:mt-4">
                                <Text className={`text-xs sm:text-sm ${(formData.pregunta1 && formData.pregunta2 && formData.pregunta3 && formData.pregunta4) ? "text-green-600" : "text-orange-600"}`}>
                                    {(formData.pregunta1 && formData.pregunta2 && formData.pregunta3 && formData.pregunta4)
                                        ? "✅ Encuesta lista para enviar"
                                        : "⚠️ Debe completar todas las preguntas de calificación"
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

export default SurveyForm;
