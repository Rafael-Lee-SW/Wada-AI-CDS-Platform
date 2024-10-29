package com.ssafy.wada.application.service;

import com.ssafy.wada.application.domain.MLModel;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.CommonErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class RecommendationForwardingService {

    public void forwardAndProcessModel(String sessionKey, MLModel mlModel) {
    }
}
