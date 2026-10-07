import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import { getToken, getReferenciasById, setFirmaVerificacionReferencias, setAutorizacionReferencias } from "../services/api";
import { useParams } from "react-router-dom";
import { message, Typography, Alert, Checkbox } from "antd";
import { FileTextOutlined, UserOutlined, IdcardOutlined, BankOutlined, SolutionOutlined } from "@ant-design/icons";
import Swal from 'sweetalert2';
import "../styles/form.css";

const { Title, Text } = Typography;

const ReferencesAuthForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [authAccepted, setAuthAccepted] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [authSent, setAuthSent] = useState(false);
    const [userData, setUserData] = useState({
        nombre: '',
        cedula: '',
        empresa: '',
        cargo: '',
        yaFirmado: false
    });
    const canvasRef = useRef(null);
    const { id } = useParams();

    const fechaHoy = new Date().toLocaleDateString('es-CO');

    // ---------- Canvas de firma ----------

    // Fondo blanco: el PNG se incrusta en el PDF y la transparencia no se
    // renderiza igual en todos los visores.
    const paintBackground = (canvas) => {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const ctx = canvasRef.current.getContext('2d');
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext('2d');
        const coords = getCoordinates(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        // Se marca aquí y no en startDrawing para que un clic seco no cuente como firma.
        if (!hasSignature) setHasSignature(true);
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearSignature = () => {
        paintBackground(canvasRef.current);
        setHasSignature(false);
    };

    // El canvas se exporta como PNG binario (Blob), no como base64.
    const getSignatureBlob = () => new Promise((resolve, reject) => {
        canvasRef.current.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen de la firma'))),
            'image/png'
        );
    });

    // ---------- Envío ----------

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            if (!authAccepted || !hasSignature) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Requeridos',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">Faltan datos para poder registrar la autorización.</p>
                            <div class="bg-yellow-50 p-3 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    ${!authAccepted ? 'Debe marcar la casilla de aceptación.<br/>' : ''}
                                    ${!hasSignature ? 'Debe dibujar su firma en el recuadro.' : ''}
                                </p>
                            </div>
                        </div>
                    `,
                    confirmButtonColor: '#1FB9B9',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            const result = await Swal.fire({
                icon: 'question',
                title: 'Confirmar Autorización',
                html: `
                    <div class="text-left">
                        <p class="mb-3">¿Está seguro de que desea enviar su autorización?</p>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <p class="text-sm text-blue-800">
                                <strong>Datos del candidato:</strong><br/>
                                • Nombre: ${userData.nombre}<br/>
                                • Documento: ${userData.cedula}<br/>
                                • Empresa contratante: ${userData.empresa}<br/>
                                • Fecha: ${fechaHoy}
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

            if (!result.isConfirmed) return;

            Swal.fire({
                title: 'Enviando Autorización...',
                html: `
                    <div class="text-center">
                        <p class="text-sm text-gray-600">Registrando su firma...</p>
                    </div>
                `,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const blob = await getSignatureBlob();
            await setFirmaVerificacionReferencias(id, blob, `firma_referencias_${id}.png`);

            // Llamada aparte, y solo si la firma quedó guardada: si setBinaryData
            // falla, esta línea no se ejecuta y Autorizacion no queda en "Si".
            await setAutorizacionReferencias(id, 'Si');

            setAuthSent(true);

            await Swal.fire({
                icon: 'success',
                title: '¡Autorización Registrada!',
                html: `
                    <div class="text-center">
                        <p class="text-lg mb-3">Su firma ha sido registrada exitosamente.</p>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-sm text-green-800">
                                <strong>Autorización procesada para:</strong><br/>
                                ${userData.nombre} - ${userData.empresa}
                            </p>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#1FB9B9',
                confirmButtonText: 'Finalizar'
            });

        } catch (error) {
            console.error("Error enviando autorización:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al Enviar la Autorización',
                html: `
                    <div class="text-left">
                        <p class="mb-3">Ha ocurrido un error al registrar su firma.</p>
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

    // ---------- Carga inicial ----------

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);
                const token = await getToken("acertar.portal", "acertar.portal");
                if (token) {
                    sessionStorage.setItem("token", token);
                } else {
                    message.error("Error al obtener token de autenticación");
                    return;
                }

                const data = await getReferenciasById(id);
                if (data) {
                    setUserData(data);
                } else {
                    message.error("No se encontraron datos del candidato");
                }
            } catch (error) {
                console.error("Error inicializando:", error);
                message.error("Error al inicializar el portal");
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [id]);

    // El canvas solo existe cuando se muestra el formulario, por eso el efecto
    // depende de las banderas que deciden qué pantalla se renderiza.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        paintBackground(canvas);

        const resizeCanvas = () => {
            const containerWidth = canvas.parentElement.clientWidth - 32;
            const newWidth = Math.min(containerWidth, 600);
            canvas.style.width = newWidth + 'px';
            canvas.style.height = (newWidth / 3) + 'px';
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [loading, authSent, userData.yaFirmado]);

    // ---------- Pantallas ----------

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="loading-spinner mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando autorización de verificación de datos...</p>
                        <p className="text-gray-500 text-sm mt-2">Obteniendo datos del candidato...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (userData.yaFirmado && !authSent) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-4">
                        <div className="bg-blue-100 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-blue-600 mb-4">Autorización ya Firmada</h1>
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                            <p className="text-lg text-blue-800 mb-4">
                                <strong>Este candidato ya firmó la autorización de verificación de datos.</strong>
                            </p>
                            <p className="text-blue-700">
                                El documento ya fue enviado y procesado anteriormente. No es posible volver a firmarlo.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
                            <p className="text-gray-700"><strong>Nombre:</strong> {userData.nombre}</p>
                            <p className="text-gray-700"><strong>Documento:</strong> {userData.cedula}</p>
                            <p className="text-gray-700"><strong>Empresa:</strong> {userData.empresa}</p>
                        </div>
                        <button
                            onClick={() => window.close()}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Cerrar Ventana
                        </button>
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-gray-500 text-sm">Portal de Autorizaciones - Sistema Seguro</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (authSent) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-2xl mx-4">
                        <div className="bg-green-100 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-green-600 mb-4">
                            ¡Autorización Registrada Exitosamente!
                        </h1>
                        <div className="bg-green-50 rounded-lg p-6 mb-6">
                            <p className="text-lg text-green-800 mb-4">
                                <strong>Gracias por firmar la autorización.</strong>
                            </p>
                            <p className="text-green-700">
                                Su firma quedó registrada y el documento de autorización para la recolección
                                y verificación de datos ya se encuentra completo.
                            </p>
                        </div>
                        <button
                            onClick={() => window.close()}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Cerrar Ventana
                        </button>
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-gray-500 text-sm">Portal de Autorizaciones - Sistema Seguro</p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    // ---------- Formulario ----------

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-[#1FB9B9] to-[#0E8B8B]">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">

                    {/* Encabezado del formato */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden mt-2 sm:mt-4">
                        <div className="absolute top-0 right-0 opacity-20 hidden sm:block">
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 0C44.8 0 0 44.8 0 100C0 155.2 44.8 200 100 200C155.2 200 200 155.2 200 100C200 44.8 155.2 0 100 0Z" fill="#1FB9B9" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="text-center mb-6">
                                <h1 className="text-xl sm:text-3xl font-bold text-[#1FB9B9] mb-4">
                                    AUTORIZACIÓN PARA LA RECOLECCIÓN Y VERIFICACIÓN DE DATOS
                                </h1>
                                <div className="w-16 h-1 bg-[#1FB9B9] mx-auto rounded"></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Código:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">VE-FO-01</Text>
                                </div>
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Versión:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">4</Text>
                                </div>
                                <div className="text-center">
                                    <Text className="text-gray-600 text-sm">Fecha:</Text>
                                    <Text className="text-[#1FB9B9] font-semibold block">{fechaHoy}</Text>
                                </div>
                            </div>

                            <Alert
                                message="Instrucciones"
                                description="Lea cuidadosamente el texto de la autorización, marque la casilla de aceptación y firme en el recuadro con el mouse o con el dedo."
                                type="info"
                                showIcon
                                className="mb-4"
                            />
                        </div>
                    </div>

                    {/* Datos del candidato */}
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
                                    <Text className="text-green-800 font-medium block">Documento de Identidad</Text>
                                    <Text className="text-green-600">{userData.cedula}</Text>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                                <BankOutlined className="text-orange-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-orange-800 font-medium block">Empresa Contratante</Text>
                                    <Text className="text-orange-600">{userData.empresa}</Text>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                                <SolutionOutlined className="text-purple-600 text-xl mr-3" />
                                <div>
                                    <Text className="text-purple-800 font-medium block">Cargo</Text>
                                    <Text className="text-purple-600">{userData.cargo || '—'}</Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Texto de la autorización */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-4 flex items-center text-base sm:text-lg">
                            <FileTextOutlined className="mr-2" />
                            Texto de la Autorización
                        </Title>

                        <div className="text-gray-700 leading-relaxed space-y-3 sm:space-y-4">
                            <p className="text-justify text-xs sm:text-sm">
                                Yo, <strong className="text-[#1FB9B9]">{userData.nombre}</strong> identificado(a) con el
                                documento de identidad número <strong className="text-[#1FB9B9]">{userData.cedula}</strong>,
                                autorizo a ACERTAR POLIGRAFO VSA SAS para que realice la verificación de datos vinculados
                                al proceso de selección, que ha sido solicitado por la empresa
                                contratante <strong className="text-[#1FB9B9]">{userData.empresa}</strong>, para ejercer el
                                cargo de <strong className="text-[#1FB9B9]">{userData.cargo || '____________'}</strong>.
                            </p>

                            <p className="text-justify text-xs sm:text-sm">
                                Declaro que tengo pleno conocimiento que, toda aquella información que ACERTAR POLIGRAFO VSA
                                SAS llegue a conocer por medio de mi hoja de vida, así como la información adicional que sea
                                recolectada y/o solicitada por parte de ACERTAR POLIGRAFO VSA S.A.S, durante la verificación
                                de datos, que esté relacionada con la consulta de antecedentes penales y judiciales, tránsito
                                y transporte, seguridad social, centrales de riesgo, visita domiciliaria, autenticidad de
                                documentos y referencias familiares, personales, educativas y laborales. De igual manera
                                declaro que estoy enterado(a) que se consultarán exclusivamente los datos que se soliciten
                                para el proceso y que dicha consulta se realizará en fuentes de información públicas y/o
                                privadas autorizadas.
                            </p>

                            <p className="text-justify text-xs sm:text-sm">
                                En caso de requerir visita domiciliaria durante mi proceso con la empresa contratante,
                                autorizo al profesional designado a solicitar datos personales, propios y/o de mis
                                familiares, los cuales podrán ser verificados por medio de fuentes de información públicas
                                o privadas, documentos originales de estudios y laborales para corroborar los datos
                                suministrados, así como también, autorizo la toma de fotos dentro y fuera de la vivienda en
                                las que yo aparezco y/o mis familiares, para dejar constancia de la visita realizada.
                            </p>

                            <p className="text-justify text-xs sm:text-sm">
                                De igual forma, declaro que se me ha informado en qué consiste la Visita Domiciliaria y cuál
                                es su propósito y entiendo que puedo retirar mi consentimiento en cualquier momento antes de
                                que la visita sea practicada.
                            </p>

                            <p className="text-justify text-xs sm:text-sm">
                                Entiendo que de acuerdo con lo dispuesto por la ley estatuaria 1581 de 2012, por lo cual, se
                                dictan las disposiciones generales para la protección de datos personales, esta información
                                se mantendrá bajo estricta confidencialidad, por lo que, solo será compartida con la empresa
                                contratante de la verificación de datos y no podrá ser revelada a personas no autorizadas,
                                ni utilizada con otros fines distintos al proceso que se lleva a cabo, con excepción a la
                                atención de requerimientos de autoridades judiciales en ejercicio de sus funciones.
                            </p>

                            <p className="text-justify text-xs sm:text-sm">
                                Igualmente, declaro entender que (I) ACERTAR POLIGRAFO VSA SAS es considerado como un tercero
                                de buena fe, exento de culpa respecto de la veracidad de la información que recibe y
                                transmite a la empresa contratante en su actividad de verificación; (II) ACERTAR POLIGRAFO
                                VSA SAS mantendrá la información recopilada y la resultante de la verificación de datos para
                                fines históricos y de control.
                            </p>
                        </div>
                    </div>

                    {/* Firma */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <Title level={3} className="text-[#1FB9B9] mb-4 flex items-center text-base sm:text-lg">
                            <FileTextOutlined className="mr-2" />
                            Firma Autorizando
                        </Title>

                        <div className="border-2 border-gray-300 rounded-lg p-2 sm:p-4 bg-white">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={200}
                                className="w-full border border-gray-200 rounded cursor-crosshair max-w-full"
                                style={{ touchAction: 'none' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
                                }}
                                onTouchMove={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    draw({ clientX: touch.clientX, clientY: touch.clientY });
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    stopDrawing();
                                }}
                            />
                            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <button
                                    type="button"
                                    onClick={clearSignature}
                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors w-full sm:w-auto"
                                >
                                    Limpiar
                                </button>
                                {hasSignature && (
                                    <div className="flex items-center text-green-600 text-xs sm:text-sm">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium">Firma capturada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Dibuje su firma con el mouse o con el dedo. Se guarda automáticamente al enviar.
                        </p>

                        <div className="mt-4 sm:mt-6 space-y-1 text-xs sm:text-sm text-gray-600">
                            <p><strong>Documento de identidad:</strong> {userData.cedula}</p>
                            <p><strong>Fecha:</strong> {fechaHoy}</p>
                        </div>
                    </div>

                    {/* Aceptación y envío */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                        <div className="flex items-start space-x-3 mb-6">
                            <Checkbox
                                checked={authAccepted}
                                onChange={(e) => setAuthAccepted(e.target.checked)}
                                className="mt-1"
                            />
                            <Text className="text-gray-700 text-xs sm:text-sm">
                                He leído y acepto de manera libre y voluntaria la autorización para la recolección y
                                verificación de mis datos en los términos descritos en este documento.
                            </Text>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || !authAccepted || !hasSignature}
                            className="w-full bg-[#1FB9B9] hover:bg-[#0E8B8B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            {submitting ? 'Enviando...' : 'Enviar Autorización'}
                        </button>

                        <div className="mt-4 text-center">
                            <Text className={`text-xs sm:text-sm ${(authAccepted && hasSignature) ? 'text-green-600' : 'text-orange-600'}`}>
                                {(authAccepted && hasSignature)
                                    ? 'Listo para enviar'
                                    : 'Debe aceptar la autorización y firmar para poder enviar'}
                            </Text>
                        </div>
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default ReferencesAuthForm;
