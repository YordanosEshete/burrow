package app.burrow

class ServerError(val code: Int, message: String) : Exception(message)
