import axios from "axios";
import { API_URL } from "../utils/constants";


// Función para obtener datos de la API
export const getData = async (endpoint) => {
    try {
        const response = await axios.get(`${API_URL}/${endpoint}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error.message);
        throw error;
    }
};

// Función para enviar datos (POST) a la API
export const postData = async (endpoint, data) => {
    try {
        const response = await axios.post(`${API_URL}/${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error.message);
        throw error;
    }
};

// Función para obtener detalles de catálogo
export const getQuestionsById = async (idForm) => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        let query = encodeURI(`SELECT R59302781,Realizada FROM Encuesta_Cita WHERE id = ${idForm}`);
        let Plantilla = await getData(`rest/api/selectQuery?maxRows=1&query=${query}&sessionId=${token}&output=json`);
        let isClient = false;
        if (Plantilla.length === 0) {
            query = encodeURI(`SELECT R59395341,Realizada FROM Encuesta_Cliente WHERE id = ${idForm}`);
            Plantilla = await getData(`rest/api/selectQuery?maxRows=1&query=${query}&sessionId=${token}&output=json`);
            isClient = true;
        }
        if (Plantilla.length > 0 && Plantilla[0][1] === 0 || !Plantilla[0][1]) {
            const queryQuestions = encodeURIComponent(`SELECT Orden,Tipo#value,Titulo,Opciones,Titulo_Plantilla,id FROM Preguntas_Plantilla WHERE R59302436 = ${Plantilla[0][0]} ORDER BY Orden ASC`);
            const dataQuestions = await getData(`rest/api/selectQuery?maxRows=99999&query=${queryQuestions}&sessionId=${token}&output=json`);
            return { dataQuestions, isClient }; // Ajusta según la estructura de la API
        } else {
            return { dataQuestions: null, isClient };
        }
    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const getQuestionsByIdStatic = async (idForm) => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        if (idForm) {
            const queryQuestions = encodeURIComponent(`SELECT Secuencia,Pregunta,Titulo_Plantilla,id,Subtitulo,Dependencia_Pregunta FROM Cuestionario_Pregunta WHERE R68565096 = ${idForm} ORDER BY Secuencia ASC`);
            const dataQuestions = await getData(`rest/api/selectQuery?maxRows=99999&query=${queryQuestions}&sessionId=${token}&output=json`);
            return { dataQuestions, isClient: false }; // Ajusta según la estructura de la API
        } else {
            return { dataQuestions: null, isClient: false };
        }
    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const getFormatFormByIdUser = async (idUser) => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        if (idUser) {
            const queryQuestions = encodeURIComponent(`SELECT id,Aplicar_Cuestionario#code FROM Encuesta WHERE id = ${idUser} ORDER BY Secuencia ASC`);
            const data = await getData(`rest/api/selectQuery?maxRows=1&query=${queryQuestions}&sessionId=${token}&output=json`);
            return data[0][1]; // Ajusta según la estructura de la API
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const getCountryByIdClient = async (idClient) => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        if (idClient) {
            const queryQuestions = encodeURIComponent(`SELECT id,R71882384 FROM Cliente7 WHERE id = ${idClient}`);
            const data = await getData(`rest/api/selectQuery?maxRows=1&query=${queryQuestions}&sessionId=${token}&output=json`);
            return data[0][1]; // Ajusta según la estructura de la API
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const getClients = async () => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        const query = encodeURIComponent(`SELECT id,name FROM Cliente1`);
        const data = await getData(`rest/api/selectQuery?maxRows=99999&query=${query}&sessionId=${token}&output=json`);
        return data; // Ajusta según la estructura de la API

    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const getUserById = async (id) => {
    try {
        // Construir consulta
        const token = sessionStorage.getItem("token");
        const query = encodeURIComponent(`SELECT id,Candidatotxt,Num_Documento,cliente_txt,Autorizado,TipoExamenTxt FROM Examen WHERE id = ${id}`);
        const data = await getData(`rest/api/selectQuery?maxRows=1&query=${query}&sessionId=${token}&output=json`);
        
        // Verificar si hay datos y devolver la estructura correcta
        if (data && data.length > 0) {
            const [id_user, nombre, cedula, empresa, autorizado, type] = data[0];
            return {
                id: id_user,
                nombre,
                cedula,
                empresa,
                autorizado: autorizado === 1 || autorizado === true, // Convertir a boolean
                tipoExamen: type
            };
        }
        
        return null;

    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
};

export const updateExamenById = async (id, data) => {
    try {
        const token = sessionStorage.getItem("token");
        
        // Extraer los datos del consentimiento
        const base64Firma = data.signatureData || '';
        const fechaHoraConsentimiento = data.signatureDate || new Date().toISOString();
        const fechaNacimiento = data.formData?.fechaNacimiento || '';
        
        // Usar XML para evitar URL demasiado larga
        const command = `update?objName=Examen&sessionId=${token}&output=json`;
        const xmlData = `
        <data objName="Examen" id="${id}" useIds="true">
          <Field name="base64Firma">${base64Firma}</Field>
          <Field name="Fecha_Hora_Consentimiento">${fechaHoraConsentimiento}</Field>
          <Field name="Fecha_Nacimiento">${fechaNacimiento}</Field>
          <Field name="Autorizado">true</Field>
        </data>`;
        
        const response = await postActionXml(command, xmlData);
        return response;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

export const updateExamenEncuestaById = async (id, data) => {
    try {
        const token = sessionStorage.getItem("token");
        const response = await axios.post(`${API_URL}/updateRecord?output=json&objName=Examen&id=${id}&JSON_form=${JSON.stringify(data)}&sessionId=${token}`);
        return response;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
}

export const updateQuestionsById = async (idForm, data, isClient) => {
    try {
        const token = sessionStorage.getItem("token");
        const response = await axios.post(`${API_URL}/updateRecord?output=json&objName=${isClient ? "Encuesta_Cliente" : "Encuesta_Cita"}&id=${idForm}&JSON_form=${JSON.stringify(data)}&sessionId=${token}`);
        return response;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

export const createQuestionsById = async (idUser,idPlantilla, data) => {
    try {
        const token = sessionStorage.getItem("token");
        const { mandatory, dataQuestions } = data;
        
        // Crear el JSON con la estructura separada
        const jsonData = {
            mandatory: mandatory,
            dataQuestions: dataQuestions
        };
        
        const response = await axios.post(`${API_URL}/create2?output=json&objName=Encuesta_Cuestionario&R68570264=${idUser}&Numero_Documento=${mandatory.Numero_Documento}&R68570430=${idPlantilla}&JSON_form=${JSON.stringify(jsonData)}&sessionId=${token}`);
        return response;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

export const createQuestionsClientById = async (idPlantilla, data, Client) => {
    try {
        const token = sessionStorage.getItem("token");
        const response = await axios.post(`${API_URL}/create2?output=json&objName=Encuesta_Cliente&&R59395295=${Client?.value}&R59395341=${idPlantilla}&JSON_form=${JSON.stringify(data)}&sessionId=${token}`);
        return response;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

export const getToken = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login?loginName=${username}&password=${password}&output=json`);
        return response.data.sessionId;
    } catch (e) {
        console.log(e);
        return undefined;
    }
}

// Función para enviar archivos adjuntos
export const updateAttachs = async (id, attach) => {
    try {
        const token = sessionStorage.getItem("token");
        const command = `update?objName=Proveedor&sessionId=${token}&output=json`;
        const xmlData = `
        <data objName="Cliente7" id="${id}" useIds="true">
          <Field name="JSON_files">${attach}</Field>
        </data>`;
        const data = await postActionXml(command, xmlData);
        return data;
    } catch (error) {
        console.error("Error fetching catalog details:", error.message);
        throw error;
    }
}

// Función para enviar XML
export const postActionXml = async (command, xmlData) => {
    try {
        const response = await axios.post(`${API_URL}/${command}`, xmlData, {
            headers: {
                'Content-Type': 'application/xml'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error posting XML data:", error.message);
        throw error;
    }
}
// ============================================================
// Autorización para la recolección y verificación de datos (VE-FO-01)
// ============================================================

// Datos del candidato para el formato de referencias.
// Firma_Verificacion_Referencias llega null mientras no haya firmado.
export const getReferenciasById = async (id) => {
    try {
        const token = sessionStorage.getItem("token");
        const query = encodeURIComponent(`SELECT id,Candidatotxt,Num_Documento,cliente_txt,Cargo,Firma_Verificacion_Referencias FROM Examen WHERE id = ${id}`);
        const response = await axios.get(`${API_URL}/selectQuery?maxRows=1&query=${query}&sessionId=${token}&output=json`);
        const data = response.data;

        if (data && data.length > 0) {
            const [id_user, nombre, cedula, empresa, cargo, firma] = data[0];
            return {
                id: id_user,
                nombre: nombre || '',
                cedula: cedula || '',
                empresa: empresa || '',
                cargo: cargo || '',
                yaFirmado: firma !== null && firma !== undefined && firma !== ''
            };
        }

        return null;
    } catch (error) {
        console.error("Error obteniendo datos de referencias:", error.message);
        throw error;
    }
};

// Sube la firma al campo File Firma_Verificacion_Referencias.
// No va en base64: setBinaryData recibe los bytes del PNG en el cuerpo del POST,
// igual que getBinaryData los devuelve en crudo.
export const setFirmaVerificacionReferencias = async (id, blob, fileName = 'firma_referencias.png') => {
    const token = sessionStorage.getItem("token");
    const url = `${API_URL}/setBinaryData?output=json&objName=Examen&id=${id}` +
        `&fieldName=Firma_Verificacion_Referencias&fileName=${encodeURIComponent(fileName)}&sessionId=${token}`;

    const response = await axios.post(url, blob, {
        headers: { 'Content-Type': blob.type || 'image/png' }
    });

    // Rollbase responde HTTP 200 incluso cuando falla; el estado real va en el cuerpo.
    const data = response.data;
    if (data && data.status === 'fail') {
        throw new Error(data.message || 'No se pudo guardar la firma');
    }
    return data;
};

// Marca la autorización como firmada. Va en una llamada aparte a propósito:
// setBinaryData solo transporta la imagen de la firma, nada más.
export const setAutorizacionReferencias = async (id, valor = 'Si') => {
    const token = sessionStorage.getItem("token");
    const url = `${API_URL}/updateRecord?output=json&objName=Examen&id=${id}` +
        `&Autorizacion=${encodeURIComponent(valor)}&sessionId=${token}`;

    const response = await axios.post(url);

    const data = response.data;
    if (data && data.status === 'fail') {
        throw new Error(data.message || 'No se pudo actualizar el campo Autorizacion');
    }
    return data;
};
