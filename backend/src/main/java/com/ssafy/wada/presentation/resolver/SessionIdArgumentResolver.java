package com.ssafy.wada.presentation.resolver;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.ssafy.wada.common.annotation.SessionId;
import com.ssafy.wada.common.error.BusinessException;
import com.ssafy.wada.common.error.SessionErrorCode;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class SessionIdArgumentResolver implements HandlerMethodArgumentResolver {

	private static final String HEADER_KEY = "sessionId";

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(SessionId.class) &&
			parameter.getParameterType().equals(String.class);
	}

	@Override
	public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
		NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
		HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
		String sessionId = request.getHeader(HEADER_KEY);

		if (sessionId == null) {
			throw new BusinessException(SessionErrorCode.NOT_EXIST_SESSION_ID);
		}

		return sessionId;
	}
}
