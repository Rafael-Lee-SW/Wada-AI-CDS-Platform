package com.ssafy.wada.presentation.controller;

import com.ssafy.wada.application.domain.MLModel;
import com.ssafy.wada.application.service.RecommendationForwardingService;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.CommonErrorCode;
import com.ssafy.wada.common.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping ("/api/patchmdel")
@RestController
@RequiredArgsConstructor
public class MLModelDispatchController  {
    private final MLModelDispatchController mlModelDispatchController;
    private final RecommendationForwardingService recommendationForwardingService;

    @GetMapping
    public ResponseEntity<?> dispatchModel(
        @RequestParam("model") MLModel mlModel,
        @RequestHeader("Cookie") String cookieHeader
    ){
        try{
            String sessionKey = extractSessionKey(cookieHeader);

            recommendationForwardingService.forwardAndProcessModel(sessionKey,mlModel);

            return ResponseEntity.ok().build();
        }catch(BusinessException e){
            throw new BusinessException(CommonErrorCode.UNKNOWN_ERROR);
        }catch(Exception e){
            throw e;
        }
    }

    private String extractSessionKey(String cookieHeader) {
        for(String cookie : cookieHeader.split(";")){
            if(cookie.trim().startsWith("sesstion_key=")){
                return cookie.split("=")[1];
            }
        }
        throw new BusinessException(CommonErrorCode.INVALID_PARAMETER_ERROR);
    }
}
