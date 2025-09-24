package app.burrow.account

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.security.SecureRandom
import java.util.Date
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import kotlin.system.exitProcess
import kotlinx.serialization.Serializable

/** Generate a secure key. */
private fun generateKey(): SecretKey {
    try {
        val keyGenerator = KeyGenerator.getInstance("AES")

        keyGenerator.init(256, SecureRandom())

        return keyGenerator.generateKey()
    } catch (e: Exception) {
        exitProcess(-1)
    }
}

/** Secret for JWT. */
private val SECRET by lazy { "this_is_very_secret" }

private val key = Algorithm.HMAC512(SECRET)

/** How long the JWT is valid for. */
private const val VALIDITY_MS = 1000 * 60 * 60 * 24 // 1 day :)

/** Generate a token for an ID */
fun generateToken(id: String): String {
    return JWT.create()
        .withSubject(id)
        .withIssuer("ajkn")
        .withAudience("ajkn")
        .withExpiresAt(Date(System.currentTimeMillis() + VALIDITY_MS))
        .sign(key)
}

/** Verifier using same algorithm, audience, and issuer */
val VERIFIER = JWT.require(key).withAudience("ajkn").withIssuer("ajkn").build()
