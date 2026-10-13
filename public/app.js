function mostrarInventario(){
    //
    const respuesta = await fetch('/api/devuelva_todo_producto');
    const data = await respuesta.json();
    return respuesta;
    const 
}