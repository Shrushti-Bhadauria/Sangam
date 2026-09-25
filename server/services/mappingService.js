class MappingService {
  /**
   * Transforms heterogeneous departmental payloads into Sangam Canonical Schema
   */
  mapDepartmentData(department, rawPayload) {
    if (!rawPayload) return { canonicalData: null, status: 'FAILED', error: 'Empty raw payload' };

    try {
      let canonicalData = {};
      const transformations = [];

      switch (department.toUpperCase()) {
        case 'REVENUE': {
          // Revenue payload fields: certificate_number, applicant_name, father_name, income_amount, currency, issue_date, valid_until, land_holding_acres, ration_card_type
          canonicalData = {
            schemaVersion: '1.0.0-sangam',
            documentType: 'INCOME_CERTIFICATE',
            sourceDepartment: 'REVENUE',
            certificateNumber: rawPayload.certificate_number || rawPayload.cert_number || null,
            beneficiaryName: rawPayload.applicant_name || null,
            guardianName: rawPayload.father_name || null,
            annualIncome: Number(rawPayload.income_amount || rawPayload.annual_income || 0),
            currency: rawPayload.currency || 'INR',
            issuingAuthority: rawPayload.issuing_authority || 'Tehsildar Office',
            issuedDate: rawPayload.issue_date || null,
            validUntil: rawPayload.valid_until || null,
            landHoldingAcres: rawPayload.land_holding_acres !== undefined ? Number(rawPayload.land_holding_acres) : null,
            economicCategory: rawPayload.ration_card_type || 'GENERAL',
            isGovernmentVerified: rawPayload.verification_status === 'VERIFIED_LEGITIMATE'
          };

          transformations.push(
            { sourceField: 'income_amount', targetField: 'annualIncome', value: canonicalData.annualIncome },
            { sourceField: 'certificate_number', targetField: 'certificateNumber', value: canonicalData.certificateNumber },
            { sourceField: 'issue_date', targetField: 'issuedDate', value: canonicalData.issuedDate },
            { sourceField: 'land_holding_acres', targetField: 'landHoldingAcres', value: canonicalData.landHoldingAcres }
          );
          break;
        }

        case 'EDUCATION': {
          canonicalData = {
            schemaVersion: '1.0.0-sangam',
            documentType: 'STUDENT_ENROLLMENT',
            sourceDepartment: 'EDUCATION',
            enrollmentNumber: rawPayload.enrollment_no || null,
            institutionName: rawPayload.institution || null,
            courseName: rawPayload.course || null,
            academicYear: rawPayload.academic_year || null,
            cgpa: Number(rawPayload.current_cgpa || 0),
            attendancePercentage: Number(rawPayload.attendance_percentage || 0),
            annualTuitionFee: Number(rawPayload.fee_structure_annual || 0),
            admissionCategory: rawPayload.admission_category || null
          };

          transformations.push(
            { sourceField: 'enrollment_no', targetField: 'enrollmentNumber', value: canonicalData.enrollmentNumber },
            { sourceField: 'current_cgpa', targetField: 'cgpa', value: canonicalData.cgpa }
          );
          break;
        }

        case 'WELFARE': {
          canonicalData = {
            schemaVersion: '1.0.0-sangam',
            documentType: 'BENEFICIARY_PROFILE',
            sourceDepartment: 'WELFARE',
            casteCategory: rawPayload.category || null,
            casteCertificateNumber: rawPayload.caste_cert_no || null,
            nonCreamyLayerCertificate: rawPayload.non_creamy_layer_cert || null,
            priorBenefits: rawPayload.prior_benefits_availed || [],
            bankAccountSeeded: !!rawPayload.bank_account_seeded
          };

          transformations.push(
            { sourceField: 'category', targetField: 'casteCategory', value: canonicalData.casteCategory },
            { sourceField: 'caste_cert_no', targetField: 'casteCertificateNumber', value: canonicalData.casteCertificateNumber }
          );
          break;
        }

        case 'CITIZEN_REGISTRY': {
          canonicalData = {
            schemaVersion: '1.0.0-sangam',
            documentType: 'DEMOGRAPHIC_VERIFICATION',
            sourceDepartment: 'CITIZEN_REGISTRY',
            sangamId: rawPayload.sangam_uid || null,
            legalName: rawPayload.full_legal_name || null,
            dateOfBirth: rawPayload.dob || null,
            gender: rawPayload.gender || null,
            domicileState: rawPayload.domicile_state || 'Maharashtra',
            isStateDomicile: rawPayload.domicile_state === 'Maharashtra'
          };
          break;
        }

        default:
          canonicalData = { ...rawPayload };
      }

      return {
        canonicalData,
        transformations,
        status: 'SUCCESS'
      };
    } catch (err) {
      return {
        canonicalData: null,
        transformations: [],
        status: 'FAILED',
        error: err.message
      };
    }
  }
}

module.exports = new MappingService();
